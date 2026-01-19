import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
// IONIC IMPORTS
import {
  IonContent, IonLabel, IonItem, IonInput,
  IonButton, IonChip, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, closeCircleOutline } from 'ionicons/icons';

// SCANNER IMPORTS
import {
  BarcodeScanner,
  BarcodeFormat,
  LensFacing
} from '@capacitor-mlkit/barcode-scanning';

import { MtVerificationModal } from '@metasperu/component/mt-verification-modal/mt-verification-modal'
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@metasperu/services/store.service';

@Component({
  selector: 'pocket-scanner',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonLabel,
    IonItem, IonInput, IonButton, IonChip, IonIcon
  ],
  templateUrl: './pocket.html',
  styleUrl: './pocket.scss',
})
export default class Pocket {
  private dialog = inject(MatDialog);
  private pocketService = inject(PocketInventoryService);
  private store = inject(StorageService);
  private alertCtrl = inject(AlertController);

  sessionCode = signal('');
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);
  isScanning = signal(false); // Nuevo: Controla el estado visual

  constructor() {
    addIcons({ scanOutline, closeCircleOutline });

    const codePocket = this.store.getStore('pocketCode');
    const valueCode = codePocket?.value ?? '';

    if (!valueCode?.length) {
      this.openVerification();
    } else {
      this.sessionCode.set(valueCode); // Corregido: set() para signals
    }

    this.updatePendingCount();
    window.addEventListener('online', () => this.onNetworkChange(true));
    window.addEventListener('offline', () => this.onNetworkChange(false));
  }

  // --- LÓGICA DEL ESCÁNER ---
  // --- LÓGICA DEL ESCÁNER ACTUALIZADA ---
  async startScan() {
    try {
      const isSupported = await BarcodeScanner.isSupported();
      if (!isSupported.supported) return;

      const status = await BarcodeScanner.requestPermissions();
      if (status.camera !== 'granted') return;

      this.isScanning.set(true);
      document.querySelector('body')?.classList.add('barcode-scanner-active');

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Code128, BarcodeFormat.Ean13, BarcodeFormat.QrCode],
      });

      this.stopScan();

      // CORRECCIÓN DEL ERROR DE TIPO:
      if (barcodes.length > 0) {
        // Usamos el operador ?? '' para garantizar que siempre sea un string
        const valorLeido = barcodes[0].rawValue ?? '';

        if (valorLeido) {
          this.skuInput.set(valorLeido);
          await this.handleScan();
        }
      }
    } catch (e) {
      console.error('Error en escaneo:', e);
      this.stopScan();
    }
  }

  stopScan() {
    this.isScanning.set(false);
    document.querySelector('body')?.classList.remove('barcode-scanner-active');
  }

  // --- LÓGICA EXISTENTE ---
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

  async handleScan() {
    if (!this.skuInput()) return;
    await this.pocketService.saveScanLocally(this.sessionCode(), this.skuInput());
    this.skuInput.set('');
    await this.updatePendingCount();
    if (this.isOnline()) await this.sync();
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