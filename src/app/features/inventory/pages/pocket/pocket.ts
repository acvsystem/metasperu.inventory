import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
import {
  IonContent, IonLabel, IonItem, IonInput,
  IonButton, IonChip, IonIcon, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { scanOutline, closeCircleOutline } from 'ionicons/icons';

// Lector para PWA (Navegador)
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

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
export default class Pocket implements OnDestroy {
  private dialog = inject(MatDialog);
  private pocketService = inject(PocketInventoryService);
  private store = inject(StorageService);
  private alertCtrl = inject(AlertController);
  // Lector de códigos de barras
  private codeReader = new BrowserMultiFormatReader(
    new Map([
      [
        DecodeHintType.POSSIBLE_FORMATS,
        [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.QR_CODE
        ]
      ]
    ])
  );

  // Signals
  sessionCode = signal('');
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);
  isScanning = signal(false);


  constructor() {
    addIcons({ scanOutline, closeCircleOutline });

    const codePocket = this.store.getStore('pocketCode');
    const valueCode = codePocket?.value ?? '';

    if (!valueCode?.length) {
      this.openVerification();
    } else {
      this.sessionCode.set(valueCode);
    }

    this.updatePendingCount();
    window.addEventListener('online', () => this.onNetworkChange(true));
    window.addEventListener('offline', () => this.onNetworkChange(false));
  }

  // --- LÓGICA DEL ESCÁNER PWA ---
  async startScan() {
    this.isScanning.set(true);

    // Pequeño delay para asegurar que el <video> esté en el DOM
    setTimeout(async () => {
      try {
        const result = await this.codeReader.decodeFromInputVideoDevice(undefined, 'video-preview');
        if (result) {
          const valorLeido = result.getText();
          this.skuInput.set(valorLeido);

          await this.handleScan(); // Guarda automáticamente
          this.stopScan(); // Cierra la cámara
        }
      } catch (err) {
        console.error('Error de cámara o escaneo:', err);
      }
    }, 300);
  }

  stopScan() {
    this.codeReader.reset(); // Apaga la cámara
    this.isScanning.set(false);
  }

  ngOnDestroy() {
    this.codeReader.reset(); // Seguridad al salir de la página
  }

  // --- LÓGICA DE NEGOCIO ---
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
    const sku = this.skuInput();
    if (!sku || sku.trim() === '') return;

    await this.pocketService.saveScanLocally(this.sessionCode(), sku);
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