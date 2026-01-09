import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, Store } from '../../../../shared/services/inventory.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonCard, IonCardHeader, IonRow, IonCol,
  IonCardTitle, IonCardContent, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MtSelect } from '../../../../shared/component/mt-select/mt-select';
import { MtInput } from '../../../../shared/component/mt-input/mt-input';
export interface PeriodicElement {
  codigo_sesion: string;
  nombre_tienda: string;
  usuario: string;
  fecha_inicio: string;
  estado: string;
}

@Component({
  selector: 'app-inventory-session',
  imports: [MatInputModule, MatFormFieldModule, MatTableModule, IonCol,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonRow,
    IonToolbar, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    MtSelect, MtInput
  ],
  templateUrl: './inventory-session.html',
  styleUrl: './inventory-session.scss',
})
export default class InventorySession {

  storeName = '';
  generatedCode = signal<string | null>(null);
  isLoading = signal(false);
  stores: Array<any> = []; // Signal para la lista de tiendas
  selectedStoreId = ''; // Almacena el ID seleccionado
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  displayedColumns: string[] = ['codigo_sesion', 'nombre_tienda', 'usuario', 'fecha_inicio', 'estado'];
  sessions: Array<any> = [];
  dataSource = new MatTableDataSource(this.sessions);

  ngOnInit() {
    this.loadStores();
    this.loeadSessions();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  loadStores() {
    this.inventoryService.getStores().subscribe({
      next: (data) => {
        (data || []).filter((store) => {

          (this.stores || []).push({
            key: (store || {}).id, value: (store || {}).nombre_tienda
          });
        });
      },
      error: (err) => console.error('Error al cargar tiendas', err)
    });
  }

  loeadSessions() {
    this.inventoryService.getSessions().subscribe({
      next: (data) => { this.sessions = data; this.dataSource = new MatTableDataSource(data); },
      error: (err) => console.error('Error al cargar tiendas', err)
    });
  }

  async onChangeSelect(data: any) {
    console.log(data);
    let selectData = data || {};
    this.selectedStoreId = (selectData || {}).key || "";
  }

  async startInventory() {
   
    if (!this.selectedStoreId) return;

    this.isLoading.set(true);
    // Buscamos el nombre de la tienda basado en el ID para enviarlo al backend
    const store = this.stores.find(s => s.key === +this.selectedStoreId);
 console.log(this.selectedStoreId)
    this.inventoryService.createSession(store!.key).subscribe({
      next: (res) => {
        this.generatedCode.set(res.session_code);
        this.isLoading.set(false);
      },
      error: (err) => { this.isLoading.set(false); }
    });
  }

  goToDashboard() {
    // Redirigir al monitor en vivo con el código recién creado
    this.router.navigate(['/admin/dashboard', this.generatedCode()]);
  }

}
