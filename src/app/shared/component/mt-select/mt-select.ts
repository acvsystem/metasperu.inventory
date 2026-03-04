import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  IonCol, IonSearchbar,
  IonItem, IonLabel, IonRow,
  IonList, IonModal,
  IonButton, IonCheckbox
} from '@ionic/angular/standalone';

@Component({
  selector: 'mt-select',
  standalone: true,
  imports: [
    MatInputModule, MatFormFieldModule, FormsModule, CommonModule, IonList, IonCheckbox,
    IonCol, IonRow, IonItem, IonSearchbar, IonLabel, IonButton, IonModal
  ],
  templateUrl: './mt-select.html',
  styleUrl: './mt-select.scss',
})
export class MtSelect {
  @Output() selectdOption: EventEmitter<any> = new EventEmitter();
  @Input() data: Array<any> = []; // Signal para la lista de tiendas
  @Input() isMultiselect: boolean = false;
  @Input() label: string = "";
  @Input() title: string = "";
  @Input() modalUser: string = "";
  @Input() checkAll: boolean = false;
  @Input() id: string = "";
  isAllSelected = false;

  isIndeterminate = false;
  selectedStoreId = ''; // Almacena el ID seleccionado
  optionSelected = {};
  filteredData: any[] = [];
  isModalOpen = false;
  selectedText = '';
  selectedValues: any[] = [];
  customAlertOptions = {
    header: this.title,
    cssClass: 'custom-alert-inventory',

    buttons: [
      {
        text: 'CANCEL',
        role: 'cancel',
        cssClass: 'alert-button-cancel'
      },
      {
        text: 'OK',
        role: 'confirm',
        cssClass: 'alert-button-confirm'
      }
    ]
  };

  ngOnInit() {
    this.customAlertOptions.header = this.title;
    this.filteredData = this.data;
    if (this.checkAll) {
      this.toggleSelectAll();
    }
  }


  openStoreModal() {
    this.filteredData = [...this.data]; // Mostramos todo al inicio
    this.isModalOpen = true;
  }

  // 3. Seleccionar item
  selectItem(tienda: any) {
    if (this.isMultiselect) {
      this.toggleSelection(tienda);
    } else {
      console.log(tienda);
      this.selectedText = tienda.value;
      this.onSelectedOption(tienda); // Tu función original
      this.isModalOpen = false;
    }
  }

  toggleSelection(tienda: any) {
    const index = this.selectedValues.findIndex(v => v.value === tienda.value);
    if (index > -1) {
      this.selectedValues.splice(index, 1);
    } else {
      this.selectedValues.push(tienda);
    }
    this.selectedText = this.selectedValues.length + ' items seletionados';
  }

  checkSelected(tienda: any) {
    return this.selectedValues.some(v => v.value === tienda.value) || this.selectedText === tienda.value;
  }

  onSelectedOption(ev: any) {
    let selected = ev;
    console.log(this.id);
    this.optionSelected = {
      id: this.id,
      key: (selected || {}).key,
      value: (selected || {}).value
    };
    this.selectedText = (selected || {}).value;
    this.selectdOption.emit(this.optionSelected);
  }

  onSelectedOptionMultiple(event: any) {
    let misSeleccionados = event;
    this.selectdOption.emit(misSeleccionados);
  }

  handleFilter(event: any) {
    const query = event.target.value.toLowerCase();

    if (query && query.trim() !== '') {
      this.filteredData = this.data.filter((tienda) => {
        return tienda.value.toLowerCase().indexOf(query) > -1;
      });
    } else {
      // Si el buscador está vacío, mostramos todo
      this.filteredData = this.data;
    }
  }

  // Alternar selección al hacer clic en cualquier parte del item
  onCheckboxChange(event: any, item: any) {
    item.selected = event.detail.checked;
  }

  toggleSelectAll() {
    this.isAllSelected = !this.isAllSelected;

    // Aplicamos el cambio a toda la lista (basado en lo que está filtrado o en todo)
    this.filteredData.forEach(item => item.selected = this.isAllSelected);

    this.checkMasterState();
  }

  toggleItem(item: any) {
    item.selected = !item.selected;
    this.checkMasterState();
  }

  checkMasterState() {
    const totalItems = this.filteredData.length;
    const selectedItems = this.filteredData.filter(i => i.selected).length;

    if (selectedItems > 0 && selectedItems < totalItems) {
      this.isIndeterminate = true;
      this.isAllSelected = false;
    } else if (selectedItems === totalItems && totalItems > 0) {
      this.isIndeterminate = false;
      this.isAllSelected = true;
    } else {
      this.isIndeterminate = false;
      this.isAllSelected = false;
    }
  }

  // Al dar OK, procesamos los seleccionados
  confirmSelection() {
    const selectedItems = this.data.filter(i => i.selected);
    if (this.isMultiselect) {
      // Actualizamos el texto que se ve en el botón principal
      if (selectedItems.length > 0) {
        this.selectedText = selectedItems.length + ' items seletionados';
      } else {
        this.selectedText = '';
      }
    } else {
      if (!this.selectedText.length) {
        this.selectedText = '';
      }
    }


    // Llamamos a tu función original de salida
    this.onSelectedOptionMultiple(selectedItems);
    this.isModalOpen = false;
  }

}
