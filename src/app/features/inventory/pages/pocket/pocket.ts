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
    if (!sku) return;

    await this.pocketService.saveScanLocally(this.sessionCode(), sku);
    this.skuInput.set('');
    await this.updatePendingCount();

    // Importante: Devolver el foco al input para el siguiente escaneo láser
    setTimeout(() => {
      this.barcodeInput?.setFocus();
    }, 150);

    if (this.isOnline()) await this.sync();
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