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
import { MtVerificationModal } from '@metasperu/component/mt-verification-modal/mt-verification-modal'
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@metasperu/services/store.service';

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

  sessionCode = signal(''); // Esto vendría de la ruta o un input inicial
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);

  constructor(private dialog: MatDialog, private pocketService: PocketInventoryService, private store: StorageService) {
    const codePocket = this.store.getStore('pocketCode');
    console.log(codePocket);
    const valueCode = codePocket?.value == 'undefined' ? '' : codePocket?.value;

    if (!valueCode?.length) {
      this.openVerification();
    } else {
      this.sessionCode = signal(valueCode);
    }

    this.updatePendingCount();

    // Escuchar cambios de red
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
      panelClass: 'custom-notification-panel' // La clase que configuramos antes para bordes redondos
    });

    dialogRef.afterClosed().subscribe(code => {
      this.sessionCode = signal(code);
      this.store.setStore('pocketCode', code);
      if (code) console.log('Código ingresado:', code);
    });
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
