import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, Store } from '../../../../shared/services/inventory.service';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inventory-session',
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonSelect, IonSelectOption
  ],
  templateUrl: './inventory-session.html',
  styleUrl: './inventory-session.scss',
})
export default class InventorySession {

  storeName = '';
  generatedCode = signal<string | null>(null);
  isLoading = signal(false);
  stores = signal<Store[]>([]); // Signal para la lista de tiendas
  selectedStoreId = ''; // Almacena el ID seleccionado
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  ngOnInit() {
    this.loadStores();
  }

  loadStores() {
    this.inventoryService.getStores().subscribe({
      next: (data) => this.stores.set(data),
      error: (err) => console.error('Error al cargar tiendas', err)
    });
  }

  async startInventory() {
    if (!this.selectedStoreId) return;

    this.isLoading.set(true);
    // Buscamos el nombre de la tienda basado en el ID para enviarlo al backend
    const store = this.stores().find(s => s.id === +this.selectedStoreId);

    this.inventoryService.createSession(store!.id).subscribe({
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
