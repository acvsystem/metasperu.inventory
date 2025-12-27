import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
  IonInput,
  IonButton,
  IonBadge,
  IonChip,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'pocket-scanner',
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonLabel,
    IonItem,
    IonInput,
    IonButton,
    IonChip
  ],
  standalone: true,
  templateUrl: './pocket.html',
  styleUrl: './pocket.scss',
})
export default class Pocket {

  sessionCode = signal('MET-ABC'); // Esto vendría de la ruta o un input inicial
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);

  constructor(private pocketService: PocketInventoryService) {
    this.updatePendingCount();

    // Escuchar cambios de red
    window.addEventListener('online', () => this.onNetworkChange(true));
    window.addEventListener('offline', () => this.onNetworkChange(false));
  }

  async onNetworkChange(status: boolean) {
    this.isOnline.set(status);
    if (status) await this.sync();
  }

  async handleScan() {
    if (!this.skuInput()) return;

    // 1. Guardar siempre en local (Rápido y Seguro)
    await this.pocketService.saveScanLocally(this.sessionCode(), this.skuInput());

    this.skuInput.set(''); // Limpiar para el siguiente escaneo
    await this.updatePendingCount();

    // 2. Intentar sincronizar si hay red
    if (this.isOnline()) {
      await this.sync();
    }
  }

  async sync() {
    const success = await this.pocketService.syncWithBackend(this.sessionCode());
    if (success) await this.updatePendingCount();
  }

  async updatePendingCount() {
    const count = await db.scans.where({ synced: 0 }).count();
    this.pendingCount.set(count);
  }

}
