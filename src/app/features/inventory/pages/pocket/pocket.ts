import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
import {
  IonContent, IonLabel, IonItem, IonInput, IonButton, IonChip
} from '@ionic/angular/standalone';
import { MtVerificationModal } from '@metasperu/component/mt-verification-modal/mt-verification-modal';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@metasperu/services/store.service';

@Component({
  selector: 'pocket-scanner',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonLabel, 
    IonItem, IonInput, IonButton, IonChip
  ],
  templateUrl: './pocket.html',
  styleUrl: './pocket.scss',
})
export default class Pocket {
  // Referencia para mantener el foco siempre activo
  @ViewChild('barcodeInput', { static: false }) barcodeInput!: any;

  sessionCode = signal(''); 
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);

  constructor(
    private dialog: MatDialog, 
    private pocketService: PocketInventoryService, 
    private store: StorageService
  ) {
    const codePocket = this.store.getStore('pocketCode');
    const valueCode = codePocket?.value === 'undefined' ? '' : codePocket?.value;

    if (!valueCode?.length) {
      this.openVerification();
    } else {
      this.sessionCode.set(valueCode); // Correcto: usar .set()
    }

    this.updatePendingCount();
    window.addEventListener('online', () => this.onNetworkChange(true));
    window.addEventListener('offline', () => this.onNetworkChange(false));
  }

  async onNetworkChange(status: boolean) {
    this.isOnline.set(status);
    if (status) await this.sync();
  }

  openVerification() {
    const dialogRef = this.dialog.open(MtVerificationModal, {
      width: '420px',
      panelClass: 'custom-notification-panel'
    });

    dialogRef.afterClosed().subscribe(code => {
      if (code) {
        this.sessionCode.set(code);
        this.store.setStore('pocketCode', code);
      }
    });
  }

  // --- FUNCIÓN DE ESCANEO AUTOMÁTICO ---
  async handleScan() {
    const sku = this.skuInput().trim();
    if (!sku) return;

    // 1. Guardar localmente
    await this.pocketService.saveScanLocally(this.sessionCode(), sku);

    // 2. Limpiar y refrescar contador
    this.skuInput.set(''); 
    await this.updatePendingCount();

    // 3. Forzar el foco de nuevo al input para el siguiente disparo del láser
    setTimeout(() => {
      this.barcodeInput?.setFocus();
    }, 100);

    // 4. Sincronizar en segundo plano si hay red (sin await para no bloquear)
    if (this.isOnline()) {
      this.sync();
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