import { Component, signal, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PocketInventoryService, PocketSyncStatus } from '../../../../shared/services/pocket-inventory.service';
import { db } from '../../../../core/db/offline-db';
import { IonContent, IonCol, IonRow } from '@ionic/angular/standalone';
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
import { PocketChat } from '@metasperu/component/pocket-chat/pocket-chat';

@Component({
  selector: 'pocket-scanner',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, IonContent, MatTabsModule, MtInput, MatPaginatorModule,
    MtSelect, IonCol, IonRow, MatTableModule, MatSortModule, PocketChat
  ],
  templateUrl: './pocket.html',
  styleUrl: './pocket.scss',
})
export default class Pocket implements OnDestroy {
  activePocketTab = 0;
  @ViewChild('newBarcodeInput') newBarcodeInput?: ElementRef<HTMLInputElement>;

  focusScanInput() {
    if (this.activePocketTab === 0) this.newBarcodeInput?.nativeElement.focus();
  }

  operationMode: 'online' | 'manual' = localStorage.getItem('pocketOperationMode') === 'manual' ? 'manual' : 'online';
  isSyncing = false;
  editingId: number | null = null;
  editSku = '';
  editQuantity = 1;
  historyTotal = 0;
  historyPage = 0;
  historyPageSize = 20;
  historyFilter = '';
  historyLoading = false;
  syncStatus: PocketSyncStatus = { sessionCode: '', phase: 'idle', confirmed: 0, total: 0, message: '', lastSuccess: null };
  lastFeedback = 'Listo para escanear';
  private historyRequest?: Subscription;
  private historyTimer?: ReturnType<typeof setTimeout>;
  private readonly onlineListener = () => this.onNetworkChange(true);
  private readonly offlineListener = () => this.onNetworkChange(false);

  ngOnDestroy() {
    this.modeSubscription?.unsubscribe();
    this.pocketService.modeChangeAllowed = () => true;
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
    this.historyRequest?.unsubscribe();
    this.syncStatusSubscription?.unsubscribe();
    clearTimeout(this.historyTimer);
  }

  private modeSubscription?: Subscription;
  private syncStatusSubscription?: Subscription;

  startEdit(row: any) {
    if (this.operationMode !== 'manual' || this.isSyncing) return;
    this.editingId = row.id;
    this.editSku = row.sku;
    this.editQuantity = row.conteo;
  }

  async savePendingEdit() {
    const quantity = Number(this.editQuantity);
    if (this.editingId === null || this.isSyncing || this.operationMode !== 'manual') return;
    if (!this.editSku.trim() || !Number.isSafeInteger(quantity) || quantity <= 0) {
      this.onNotification({ error: 'error', message: 'Ingrese un SKU y una cantidad entera mayor que cero.' });
      return;
    }
    try {
      await this.pocketService.updatePending(this.editingId, this.sessionCode(), this.editSku.trim(), quantity);
      this.editingId = null;
      this.onDataTable(this.sessionCode());
    } catch {
      this.onNotification({ error: 'error', message: 'No se pudo guardar el cambio.' });
    }
  }

  async deletePending(row: any) {
    if (this.operationMode !== 'manual' || this.isSyncing || !window.confirm(`Eliminar el escaneo ${row.sku}?`)) return;
    try {
      await this.pocketService.deletePending(row.id, this.sessionCode());
      if (this.editingId === row.id) this.editingId = null;
      await this.updatePendingCount();
      this.onDataTable(this.sessionCode());
    } catch {
      this.onNotification({ error: 'error', message: 'No se pudo eliminar el escaneo.' });
    }
  }

  loadHistory() {
    if (!this.sessionCode() || !this.isOnline()) return;
    this.historyRequest?.unsubscribe();
    this.historyLoading = true;
    this.historyRequest = this.pocketService.getHistoryPage(this.sessionCode(), this.historyPage + 1, this.historyPageSize, this.historyFilter).subscribe({
      next: result => {
        this.dataHistory.data = result.items.map((item: any) => ({
          sku: item.sku, cantidad: item.quantity,
          seccion: item.section_name || this.arAsignatedSections.find(s => s.key === item.seccion_id)?.value || '',
          estado: 'Sincronizado'
        }));
        this.historyTotal = result.total;
        this.historyLoading = false;
      },
      error: () => {
        this.historyLoading = false;
        this.onNotification({ error: 'error', message: 'No se pudo cargar el historial del servidor.' });
      }
    });
  }

  changeHistoryPage(event: any) {
    this.historyPage = event.pageIndex;
    this.historyPageSize = event.pageSize;
    this.loadHistory();
  }
  // Referencia para mantener el foco siempre activo
  @ViewChild('paginatorP') paginatorP!: MatPaginator;
  @ViewChild('paginatorH') paginatorH!: MatPaginator;
  @ViewChild('sortP') sortP!: MatSort;
  @ViewChild('sortH') sortH!: MatSort;

  sessionCode = signal('');
  skuInput = signal('');
  pendingCount = signal(0);
  isOnline = signal(navigator.onLine);
  arAsignatedSections: Array<any> = [{ key: 0, values: '' }];
  selectedSectionId: number = 0;
  registerConteo: Array<any> = [];
  inFilter: string = "";
  inCantidad: any = "";
  optionSeccion: string = "";
  OptionTypeScan: string = 'pistola';
  dataSource = new MatTableDataSource(this.registerConteo);
  displayedColumns: string[] = ['sku', 'cantidad', 'seccion', 'estado', 'acciones'];
  displayedColumns2: string[] = ['sku', 'cantidad', 'seccion', 'estado'];
  oldSKU: string = "";
  oldCantidad: string = "";
  isckeckedSku: boolean = false;
  isPermision: boolean = false;
  countSkanSection: number = 0;
  selectedSection: any = null;
  historyScans: any = [];
  dataHistory = new MatTableDataSource(this.historyScans);

  // ========== VARIABLES PARA DOBLE ESCANEO ==========
  private lastScannedCode: string | null = null;
  private lastScanTime: number = 0;
  private readonly DOUBLE_SCAN_THRESHOLD = 450; // milisegundos
  // =================================================

  constructor(
    private dialog: MatDialog,
    private pocketService: PocketInventoryService,
    private store: StorageService,
    private service: InventoryService
  ) {
    this.operationMode = this.pocketService.operationMode.value;
    this.pocketService.modeChangeAllowed = () => !this.isSyncing && this.editingId === null;
    this.modeSubscription = this.pocketService.operationMode.subscribe(mode => {
      const changed = this.operationMode !== mode;
      this.operationMode = mode;
      if (changed && mode === 'online' && this.isOnline()) void this.sync();
    });
    this.syncStatusSubscription = this.pocketService.syncStatus.subscribe(status => {
      if (!status.sessionCode || status.sessionCode === this.sessionCode()) {
        this.syncStatus = status;
        if (status.message) this.lastFeedback = status.message;
        if (status.phase === 'success' || status.phase === 'error') {
          this.updatePendingCount();
          this.onDataTable(this.sessionCode());
        }
      }
    });
    const codePocket = this.store.getStore('pocketCode');
    const valueCode = codePocket?.value === 'undefined' ? '' : codePocket?.value;
    this.asignedSections(valueCode).then(() => {
      this.onDataTable(valueCode);

      this.loadHistory();
    });

    if (!valueCode?.length) {
      this.openVerification();
    } else {
      this.sessionCode.set(valueCode);
    }

    let oldSku = localStorage.getItem('oldSku');
    let oldCantidad = localStorage.getItem('oldCantidad');
    this.oldSKU = oldSku || "";
    this.oldCantidad = oldCantidad || "";

    this.updatePendingCount();
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
    const userRole = localStorage.getItem('role');
    this.isPermision = userRole == 'administrador' || userRole == 'auditor' ? true : false;
  }

  async onNetworkChange(status: boolean) {
    this.isOnline.set(status);
    if (status && this.operationMode === 'online') await this.sync();
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
        this.asignedSections(code).then(() => {
          this.onDataTable(code);
          this.updatePendingCount();
          this.loadHistory();
        });
      }
    });
  }

  onFiltroBar(ev: any) {
    this.isckeckedSku = ev?.target?.checked || false;
  }

  saveOldSku(sku: string, cantidad: any) {
    this.oldSKU = sku;
    this.oldCantidad = cantidad;
    localStorage.setItem('oldSku', sku);
    localStorage.setItem('oldCantidad', cantidad);
  }

  // --- FUNCIÓN DE ESCANEO AUTOMÁTICO ---
  async handleScan() {
    const sku = this.isckeckedSku
      ? this.skuInput().trim().replace(/^0+/, '')
      : this.skuInput().trim();

    // ========== VALIDACIÓN DE DOBLE ESCANEO ==========
    const now = Date.now();

    if (
      this.lastScannedCode === sku &&
      (now - this.lastScanTime) < this.DOUBLE_SCAN_THRESHOLD
    ) {
      this.playErrorSound();
      this.onNotification({
        error: 'error',
        message: 'Se escaneó el mismo código 2 veces en milisegundos'
      });

      // Limpiar el input y devolver el foco
      // this.skuInput.set('');
      setTimeout(() => {
        this.focusScanInput();
      }, 50);

      return; // No continúa el proceso
    }

    // Actualizar último escaneo válido
    this.lastScannedCode = sku;
    this.lastScanTime = now;
    // ================================================

    if (this.OptionTypeScan == 'pistola') {
      if (!sku || !this.selectedSectionId) {
        this.playErrorSound();
        this.onNotification({ error: 'error', message: 'Llene todos los campos' });
        return;
      }
    } else {
      if (!sku || !this.selectedSectionId || !this.inCantidad) {
        this.playErrorSound();
        this.onNotification({ error: 'error', message: 'Llene todos los campos' });
        return;
      }
    }

    const cantidad = this.OptionTypeScan == 'cantidad' ? this.inCantidad * 1 : 1;

    if (!this.sessionCode() || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
      this.onNotification({ error: 'error', message: 'Lo ingresado no es un numero.' });
      return;
    }

    // 1. Guardar localmente
    try {
      await this.saveScanLocally(this.selectedSectionId, this.sessionCode(), sku, cantidad);
      this.lastFeedback = this.operationMode === 'manual'
        ? 'Escaneo guardado en pendientes'
        : this.isOnline()
          ? 'Escaneo guardado, enviando al servidor'
          : 'Escaneo guardado sin conexion';
    } catch {
      this.onNotification({ error: 'error', message: 'No se pudo guardar el escaneo en el dispositivo. Intente nuevamente.' });
      return;
    }

    // 2. Limpiar y refrescar contador
    this.skuInput.set('');
    await this.updatePendingCount();

    // 3. Forzar el foco de nuevo al input para el siguiente disparo del láser
    setTimeout(() => {
      this.focusScanInput();
    }, 100);

    // 4. Sincronizar en segundo plano si hay red (sin await para no bloquear)
    if (this.isOnline() && this.operationMode === 'online') {
      this.sync();
    } else {
      this.onDataTable(this.sessionCode());
    }

    this.inCantidad = "";
    this.onRefreshSectionCount();
  }

  async saveScanLocally(seccion_id: number, session_code: string, sku: any, cantidad: any) {
    await this.pocketService.saveScanLocally(seccion_id, session_code, sku, cantidad);
    this.saveOldSku(sku, cantidad);
  }

  async sync() {
    if (this.isSyncing || !this.isOnline() || !this.sessionCode() || this.editingId !== null) return;
    this.isSyncing = true;
    try {
      // Each successful batch removes only its own IDs; new scans remain queued.
      do {
        const success = await this.pocketService.syncWithBackend(this.sessionCode());
        await this.updatePendingCount();
        if (!success) break;
      } while (this.operationMode === 'online' && this.isOnline() && this.pendingCount() > 0);
      this.historyPage = 0;
      this.loadHistory();
      if (this.selectedSection) this.onRefreshSectionCount();
    } catch {
      this.onNotification({ error: 'error', message: 'No se pudo sincronizar. Revise los pendientes.' });
    } finally {
      this.isSyncing = false;
      this.onDataTable(this.sessionCode());
    }
  }

  async updatePendingCount() {
    const count = await db.scans.where({ session_code: this.sessionCode(), synced: 0 }).count();
    this.pendingCount.set(count);
  }

  private asignedSections(sessionCode: string) {
    return new Promise((resolve, reject) => {
      this.service.getAssignedSections(sessionCode).subscribe({
        next: (result) => {
          if (result?.length) {
            this.arAsignatedSections = [];
            result.map((section: any) => {
              this.arAsignatedSections.push({ key: section.id, value: section.nombre_seccion, id: section.seccion_id_fk });
            });

            if (this.arAsignatedSections.length) {
              resolve(this.arAsignatedSections);
            }
          }
          resolve(this.arAsignatedSections);
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
          resolve([]);
        }
      });
    });
  }

  async onChangeSelect(data: any) {
    const selectData = data || {};
    this.selectedSection = selectData;
    this.selectedSectionId = (selectData || {}).key || 0;
    this.optionSeccion = selectData?.value || "";

    this.countSkanSection = 0;
    this.onRefreshSectionCount();
  }

  private sectionCountRequestId = 0;

  onRefreshSectionCount() {
    const requestId = ++this.sectionCountRequestId;
    const sessionCode = this.sessionCode();
    const sectionId = Number(this.selectedSection?.id);
    if (!sessionCode || !Number.isSafeInteger(sectionId) || sectionId <= 0) {
      this.countSkanSection = 0;
      return;
    }
    if (!this.isOnline()) return;
    this.service.postSectionSession(sessionCode, sectionId).subscribe({
      next: (result) => {
        if (requestId !== this.sectionCountRequestId) return;
        this.countSkanSection = ((result || [])[0] || {}).total_cantidad || 0;
      },
      error: (err) => {
        if (requestId !== this.sectionCountRequestId) return;
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
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

  onChangeInput(data: any) {
    const { id, value } = data;
    this.inCantidad = value ?? "";
  }

  onDataTable(sessionCode: string) {
    this.pocketService.syncIndexedBD(sessionCode).then((bd: any[]) => {
      const formattedData = bd.map(item => {
        const seccionObj = this.arAsignatedSections.find(s => s.key === item.seccion_id);

        return {
          id: item.id,
          sku: item.sku,
          conteo: item.quantity,
          seccion: seccionObj ? seccionObj.value : 'DESCONOCIDO',
          estado: item.upload_attempted ? 'por confirmar' : item.synced === 1 ? 'enviado' : 'pendiente',
          locked: !!item.upload_attempted
        };
      }).reverse();

      this.dataSource.data = formattedData;
      this.dataSource.paginator = this.paginatorP;
      this.dataSource.sort = this.sortP;
    });
  }

  applyFilterHistory(data: any) {
    if (!data) return;
    this.historyFilter = (data.value ?? '').trim();
    this.historyPage = 0;
    this.historyRequest?.unsubscribe();
    clearTimeout(this.historyTimer);
    this.historyTimer = setTimeout(() => this.loadHistory(), 500);
  }

  // ========== SONIDO DE ERROR ==========

  private playErrorSound() {
    // 1. Reproducir sonido
    try {
      const audio = new Audio('assets/sounds/error-beep.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {
        console.warn('No se pudo reproducir el sonido de error');
      });
    } catch (e) {
      console.warn('Error al reproducir sonido', e);
    }

    // 2. Hacer vibrar el dispositivo
    this.vibrateError();
  }

  private vibrateError() {
    if (navigator.vibrate) {
      navigator.vibrate([500, 80, 500, 80, 500, 80, 800]);
    }
  }
}
