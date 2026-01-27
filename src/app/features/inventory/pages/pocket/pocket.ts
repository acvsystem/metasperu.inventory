import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
import {
  IonContent, IonLabel, IonItem, IonInput, IonButton, IonChip, IonCol, IonRow
} from '@ionic/angular/standalone';
import { MtVerificationModal } from '@metasperu/component/mt-verification-modal/mt-verification-modal';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@metasperu/services/store.service';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'pocket-scanner',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonLabel, MatTabsModule, MtInput, MatPaginatorModule,
    IonItem, IonInput, IonButton, IonChip, MtSelect, IonCol, IonRow, MatTableModule, MatSortModule
  ],
  templateUrl: './pocket.html',
  styleUrl: './pocket.scss',
})
export default class Pocket {
  // Referencia para mantener el foco siempre activo
  @ViewChild('barcodeInput', { static: false }) barcodeInput!: any;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  sessionCode = signal('');
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);
  arAsignatedSections: Array<any> = [{ key: 0, values: '' }];
  selectedSectionId: number = 0;
  registerConteo: Array<any> = [];
  inFilter: string = "";
  dataSource = new MatTableDataSource(this.registerConteo);
  displayedColumns: string[] = ['sku', 'cantidad', 'seccion', 'estado'];

  constructor(
    private dialog: MatDialog,
    private pocketService: PocketInventoryService,
    private store: StorageService,
    private service: InventoryService
  ) {
    const codePocket = this.store.getStore('pocketCode');
    const valueCode = codePocket?.value === 'undefined' ? '' : codePocket?.value;
    this.asignedSections(valueCode).then(() => {
      this.onDataTable(valueCode);
    });

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
        this.asignedSections(code);
      }
    });
  }

  // --- FUNCIÓN DE ESCANEO AUTOMÁTICO ---
  async handleScan() {
    const sku = this.skuInput().trim();
    if (!sku || !this.selectedSectionId) {
      this.onNotification({ error: 'error', message: 'Llene todos los campos' });
      return
    };

    // 1. Guardar localmente
    await this.pocketService.saveScanLocally(this.selectedSectionId, this.sessionCode(), sku);

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
    } else {
      this.onDataTable(this.sessionCode());
    }

  }

  async sync() {
    const success = await this.pocketService.syncWithBackend(this.sessionCode());
    if (success) await this.updatePendingCount();
    this.onDataTable(this.sessionCode());
  }

  async updatePendingCount() {
    const count = await db.scans.where({ synced: 0 }).count();
    this.pendingCount.set(count);
  }

  private asignedSections(sessionCode: string) {
    return new Promise((resolve, reject) => {
      this.service.getAssignedSections(sessionCode).subscribe({
        next: (result) => {
          if (result?.length) {
            this.arAsignatedSections = [];
            result.map((section: any) => {
              this.arAsignatedSections.push({ key: section.id, value: section.nombre_seccion });
            });

            if (this.arAsignatedSections.length) {
              resolve(this.arAsignatedSections);
            }

          }
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
        }
      });
    });
  }

  async onChangeSelect(data: any) {
    let selectData = data || {};
    this.selectedSectionId = (selectData || {}).key || 0;
  }

  onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length ? true : false,
      isError: result?.error?.length ? true : false,
      bodyNotification: result?.message
    }];

    this.service.onNotification.emit(notificationList);
  }

  applyFilter(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.inFilter = value ?? "";
    const filterValue = value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onDataTable(sessionCode: string) {
    this.pocketService.syncIndexedBD(sessionCode).then((bd: any[]) => {

      // Usamos .map para transformar cada item del array original
      const formattedData = bd.map(item => {

        const seccionObj = this.arAsignatedSections.find(s => s.key === item.seccion_id);

        return {
          sku: item.sku,
          conteo: item.quantity,
          seccion: seccionObj ? seccionObj.value : 'DESCONOCIDO',
          estado: item.synced === 1 ? 'enviado' : 'pendiente'
        };
      }).reverse();

      // 3. Asignamos los datos a la tabla
      this.dataSource.data = formattedData;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

    });
  }
}