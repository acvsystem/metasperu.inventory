import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { IonCol, IonContent, IonItem, IonLabel, IonRow, IonSelect, IonSelectOption } from '@ionic/angular/standalone';

@Component({
  selector: 'mt-select',
  standalone: true,
  imports: [
    MatInputModule, MatFormFieldModule, FormsModule, CommonModule,
    IonCol, IonRow, IonSelect, IonSelectOption, IonItem
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

  selectedStoreId = ''; // Almacena el ID seleccionado
  optionSelected = {};

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
    this.customAlertOptions.header = this.title
  }

  onSelectedOption(ev: any) {
    let selected = ev.detail.value;
    this.optionSelected = {
      key: (selected || {}).key,
      value: (selected || {}).value
    };
    this.selectdOption.emit(this.optionSelected);
  }

  onSelectedOptionMultiple(event: any) {
    let misSeleccionados = event.detail.value;
    this.selectdOption.emit(misSeleccionados);
  }


}
