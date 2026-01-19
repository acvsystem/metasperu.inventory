import { Component, signal, inject, OnDestroy, HostListener, ViewChild } from '@angular/core';
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

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, NotFoundException } from '@zxing/library';
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
  // Referencia al input para forzar el foco
  @ViewChild('barcodeInput', { static: false }) barcodeInput!: any;

  private dialog = inject(MatDialog);
  private pocketService = inject(PocketInventoryService);
  private store = inject(StorageService);
  private alertCtrl = inject(AlertController);

  private codeReader = new BrowserMultiFormatReader(
    new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.QR_CODE]]])
  );

  sessionCode = signal('');
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);
  isScanning = signal(false);

  // Forzar el foco al entrar a la pantalla
  ionViewDidEnter() {
    setTimeout(() => {
      this.barcodeInput?.setFocus();
    }, 500);
  }

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

  // --- SOPORTE ZEBRA (HARDWARE SCANNER) ---
  @HostListener('window:keydown', ['$event'])
  handleHardwareScanner(event: KeyboardEvent) {
    // Si el Zebra envía Enter, procesamos
    if (event.key === 'Enter') {
      const currentSku = this.skuInput().trim();
      if (currentSku.length > 0) {
        this.handleScan();
      }
    }
  }

  async handleScan() {
    const sku = this.skuInput().trim();

    // 1. Validar que no esté vacío
    if (!sku) return;

    try {
      // 2. Guardar en la base de datos local (Offline first)
      await this.pocketService.saveScanLocally(this.sessionCode(), sku);

      // 3. Limpiar el input INMEDIATAMENTE para recibir el siguiente código
      this.skuInput.set('');

      // 4. Actualizar el contador visual de pendientes
      await this.updatePendingCount();

      // 5. Si hay internet, intentar subirlo al servidor en segundo plano
      if (this.isOnline()) {
        this.sync(); // No usamos 'await' aquí para no frenar al usuario
      }

      // 6. Forzar que el cursor siga en el input (por si acaso se perdió el foco)
      setTimeout(() => {
        this.barcodeInput?.setFocus();
      }, 10);

    } catch (error) {
      console.error('Error al procesar escaneo automático:', error);
    }
  }

  // --- LÓGICA DE CÁMARA (Para celulares que NO sean Zebra) ---
  async startScan() {
    this.isScanning.set(true);
    setTimeout(async () => {
      try {
        const videoInputDevices = await this.codeReader.listVideoInputDevices();
        const backCamera = videoInputDevices.find(device => /back|rear|trasera/i.test(device.label));
        const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        this.codeReader.decodeFromVideoDevice(deviceId, 'video-preview', (result, err) => {
          if (result) {
            this.skuInput.set(result.getText());
            this.handleScan();
            this.stopScan();
          }
        });
      } catch (err) {
        this.stopScan();
      }
    }, 300);
  }

  stopScan() {
    this.codeReader.reset();
    this.isScanning.set(false);
  }

  ngOnDestroy() {
    this.codeReader.reset();
  }

  async onNetworkChange(status: boolean) {
    this.isOnline.set(status);
    if (status) await this.sync();
  }

  async sync() {
    const success = await this.pocketService.syncWithBackend(this.sessionCode());
    if (success) await this.updatePendingCount();
  }

  async updatePendingCount() {
    const count = await db.scans.where({ synced: 0 }).count();
    this.pendingCount.set(count);
  }

  openVerification() {
    const dialogRef = this.dialog.open(MtVerificationModal, { width: '420px', panelClass: 'custom-notification-panel' });
    dialogRef.afterClosed().subscribe(code => {
      if (code) {
        this.sessionCode.set(code);
        this.store.setStore('pocketCode', code);
      }
    });
  }
}