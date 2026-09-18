import { Component, OnInit, inject, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonCard, IonLabel,
  IonButtons, IonButton, IonIcon, IonChip,
  AlertController, ToastController, IonListHeader, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { radioOutline, cubeOutline, barcodeOutline, refreshOutline, checkmarkDoneCircle, hourglassOutline } from 'ionicons/icons';
import { MatTabsModule } from '@angular/material/tabs';
import { InventoryService } from '@metasperu/services/inventory.service';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';
import { View2Inventario } from './component/view-2-inventario/view-2-inventario'
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import * as XLSX from 'xlsx';
import { MatIconModule } from '@angular/material/icon';
import { Statistics } from '../dashboard/component/statistics/statistics';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenu } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ModalConteo } from './component/modal-conteo/modal-conteo';
import { MatBadgeModule } from '@angular/material/badge';
import { View3Inventario } from './component/view-3-inventario/view-3-inventario';
import { MtLoader } from '@metasperu/component/mt-loader/mt-loader';

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
  id?: number;
}

const toNumber = (value: any) => {
  const numericValue = typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const numberValue = Number(numericValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const inventoryDifference = (conteo: any, stock: any) => {
  const conteoValue = toNumber(conteo);
  const stockValue = toNumber(stock);
  return conteoValue - Math.abs(stockValue);
};

const sectionColumnKey = (name: string) => (name || '').trim().replace(/\s+/g, '_').toLowerCase();

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, View2Inventario, MatTabsModule, Statistics, MatBadgeModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, MatSidenavModule, MtLoader,
    IonCol, IonCard, IonLabel, IonListHeader, MatIconModule, MatTooltipModule, View3Inventario,
    IonButtons, IonButton, IonIcon, IonChip, IonCardContent, MatTableModule,
    MatPaginator, MatPaginatorModule, MatSortModule, MtInput, MatMenu, MatMenuModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export default class DashboardComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Inyecciones de dependencias
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invService = inject(InventoryService);
  public socketService = inject(InventorySocketService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Propiedades y Signals
  isDatabase = false;
  sessionCode = '';
  serieStore = '';
  pocketScan: any;
  inFilter: string = "";
  products = signal<any[]>([]);
  totalSkusCount = signal<number>(0);
  uniqueSkusCount = signal<number>(0);
  isLoading = signal(false);

  totalStock = signal<number>(0);
  totalConteo = signal<number>(0);
  totalDiferencia = signal<number>(0);

  stockFilter: number = 0;
  conteoFilter: number = 0;
  diferenciaFilter: number = 0;

  dataInventario: Array<any> = [];
  arAsignatedSections: Array<any> = [];
  dataSource = new MatTableDataSource(this.products());
  filterValues: any = {};
  allDataProcess: Array<any> = [];
  dataExportar: Array<any> = [];
  isLoading2: boolean = true;
  titleLoader: string = 'Cargando Inventario...';
  displayedColumns = ['sku', 'usuario', 'zona', 'subzona', 'cantidad', 'accion'];
  dataColumns: tableColumns[] = [
    { matColumnDef: 'sku', titleColumn: 'Sku', propertyValue: 'sku', filterActive: false, id: 0 },
    { matColumnDef: 'usuario', titleColumn: 'Usuario', propertyValue: 'user', filterActive: false, id: 0 },
    { matColumnDef: 'zona', titleColumn: 'Zona', propertyValue: 'nombre_zona', filterActive: false, id: 0 },
    { matColumnDef: 'subzona', titleColumn: 'Subzona', propertyValue: 'section_name', filterActive: false, id: 0 },
    { matColumnDef: 'cantidad', titleColumn: 'Cantidad', propertyValue: 'total_cantidad', filterActive: false, id: 0 },
    { matColumnDef: 'accion', titleColumn: 'Accion', propertyValue: '', filterActive: false, id: 0 }];

  totalUnidades = computed(() =>
    this.products().reduce((acc, curr) => acc + Number(curr.total_cantidad), 0)
  );

  constructor(public dialog: MatDialog, private socketInv: InventorySocketService) {
    addIcons({ radioOutline, cubeOutline, barcodeOutline, refreshOutline, checkmarkDoneCircle, hourglassOutline });

    effect(() => {
      const notification = this.socketService.syncNotification();

      if (notification) {
        this.loadData();
        this.presentToast(`Se sincronizaron ${notification.count} productos nuevos.`);
      }

      const inventarioSocket = this.socketService.syncInventarioStore();
      if (inventarioSocket?.length) {
        this.setCachedInventory(inventarioSocket);
        this.dataInventario = inventarioSocket;
        this.isDatabase = true;
        this.isLoading2 = false;
      }
    });
  }

  ngOnInit() {
    this.sessionCode = this.route.snapshot.paramMap.get('code') || '';
    this.serieStore = this.route.snapshot.paramMap.get('serie') || '';

    if (!this.sessionCode) {
      this.router.navigate(['/inventory/session']);
      return;
    }

    this.socketService.joinSession(this.sessionCode);
    this.asignedSections();
    const offlineData = localStorage.getItem('offline_inventory');
    const cachedInventario = this.getCachedInventory();

    if (offlineData) {
      this.isLoading2 = false;
    } else if (cachedInventario?.length) {
      this.dataInventario = cachedInventario;
      this.isDatabase = true;
      this.isLoading2 = false;
    } else {
      this.loadInventary();
    }

    // Configuración del filtro con restablecimiento a 0 si no hay criterios activos
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let searchCriteria: any;
      try {
        searchCriteria = JSON.parse(filter);
      } catch (e) {
        searchCriteria = {};
      }

      let hasActiveFilters = false;

      for (let column in searchCriteria) {
        const searchValue = searchCriteria[column];
        if (!searchValue || searchValue.trim() === '') continue;

        hasActiveFilters = true;
        const cellValue = data[column] ? data[column].toString().toLowerCase() : '';

        if (searchValue.endsWith(' ')) {
          const exactWord = searchValue.trim();
          const wordsInCell = cellValue.split(' ');
          if (!wordsInCell.includes(exactWord)) {
            return false;
          }
        } else {
          if (column === 'section_name' || column === 'sku') {
            if (cellValue !== searchValue.trim()) {
              return false;
            }
          } else {
            if (!cellValue.includes(searchValue.trim())) {
              return false;
            }
          }
        }
      }

      if (!hasActiveFilters) {
        this.stockFilter = 0;
        this.conteoFilter = 0;
        this.diferenciaFilter = 0;
      }

      return true;
    };
    this.onLoadInventarioHeader();
  }

  onAllDataProcess(data: any[]) {
    this.allDataProcess = data;
  }

  loadInventary() {
    this.isLoading2 = true;

    this.invService.getStoreInventory({ session_code: this.sessionCode, serie_store: this.serieStore }).subscribe({
      next: (res: any) => {
        if (Object.keys(res).includes('inventario')) {
          localStorage.removeItem('offline_inventory');
          this.dataInventario = [];
          const inventario = res?.inventario;
          this.isDatabase = true;
          this.dataInventario = inventario;
          this.setCachedInventory(inventario);
          this.onLoadInventarioHeader();
        }
        this.isLoading2 = false;
      },
      error: () => {
        this.isLoading2 = false;
        const cachedInventario = this.getCachedInventory();
        if (cachedInventario?.length) {
          this.dataInventario = cachedInventario;
          this.presentToast('No se pudo actualizar. Se muestra el inventario guardado.');
        }
      }
    });
  }

  onLoadInventarioHeader() {

    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;

    this.dataInventario.forEach(item => {
      const stock = toNumber(item.cStock);
      const conteo = toNumber(item.cConteo);
      totalStockGlobal += stock;
      totalConteoGlobal += conteo;
    });

    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(this.totalUnidades() - this.totalStock());
  }

  private get inventoryCacheKey() {
    const serie = this.serieStore || 'sin-serie';
    return `store_inventory_cache_${this.sessionCode}_${serie}`;
  }

  private getCachedInventory(): any[] {
    try {
      const cached = localStorage.getItem(this.inventoryCacheKey);
      if (!cached) return [];
      return JSON.parse(cached);
    } catch (error) {
      localStorage.removeItem(this.inventoryCacheKey);
      return [];
    }
  }

  private setCachedInventory(inventario: any[]) {
    try {
      localStorage.setItem(this.inventoryCacheKey, JSON.stringify(inventario || []));
    } catch (error) {
      console.warn('No se pudo guardar el inventario en localStorage:', error);
    }
  }

  loadData() {
    this.isLoading.set(true);

    this.invService.getSessionSummaryv2(this.sessionCode).subscribe({
      next: (res) => {
        const products = res.products;
        const uniqueSkusSet = new Set<string>();
        const sectionsById = new Map(this.arAsignatedSections.map(section => [section.id, section]));

        const formattedData = products.map((item: any) => {
          const seccionObj = sectionsById.get(item.seccion_id);

          if (item.sku) {
            uniqueSkusSet.add(item.sku);
          }

          const objReturn: Record<string, any> = {
            id: item.id,
            seccion_id: item.seccion_id,
            sku: item.sku,
            user: item.usuario,
            total_cantidad: item.total_cantidad,
            ultimo_escaneo: item.ultimo_escaneo,
            veces_escaneado: item.veces_escaneado,
            section_name: seccionObj ? seccionObj.nombre_seccion : 'DESCONOCIDO',
            nombre_zona: item.nombre_zona
          };

          this.arAsignatedSections.forEach((section) => {
            const sectionKey = sectionColumnKey(section.nombre_seccion);
            objReturn[sectionKey] = seccionObj?.id === section.id ? Number(item.total_cantidad) || 0 : 0;
          });

          return objReturn;
        }).reverse();

        this.totalSkusCount.set(products.length);
        this.uniqueSkusCount.set(uniqueSkusSet.size);

        this.pocketScan = formattedData;
        this.products.set(formattedData);

        this.dataSource.data = this.products();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.isLoading.set(false);

        this.dataExportar = this.dataSource.data.map(item => ({
          'CODBARRAS': item.sku,
          'USUARIO': item.user,
          'ZONA': item.nombre_zona,
          'SUBZONA': item.section_name,
          'UNIDADES': item.total_cantidad * 1,
        }));

        this.totalDiferencia.set(this.totalUnidades() - this.totalStock());
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  async confirmCloseSession() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Inventario',
      message: '¿Estás seguro de finalizar esta sesión? Los operarios ya no podrán enviar más escaneos.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sí, Finalizar', handler: () => this.closeSession() }
      ]
    });
    await alert.present();
  }

  private closeSession() {
    this.invService.putEndedSession(this.sessionCode).subscribe(() => {
      this.presentToast('Sesión de inventario cerrada correctamente.');
      this.router.navigate(['/inventory/session']);
    });
  }

  editarConteo(conteo: any) {
    const dialogRef = this.dialog.open(ModalConteo, {
      width: '350px',
      data: { ...conteo, title: 'Editar Conteo' }
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.invService.putPocketScan({ id: result.id, cantidad: result.cantidad }).subscribe({
            next: (value) => {
              this.loadData();
              this.onNotification(value);
            },
            error: (err) => {
              this.onNotification({ error: 'error', message: err?.message });
            },
          });
        }
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  private async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }

  private asignedSections() {
    this.invService.getAssignedSections(this.sessionCode).subscribe({
      next: (res) => {
        this.arAsignatedSections = res;
        this.loadData();
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  applyFilter(data: any) {
    if (!data) return;
    const { value } = data;
    this.inFilter = value ?? "";
    this.dataSource.filter = value.trim().toLowerCase();
  }

  applyFilterTable(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;
    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);

    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;
    this.filterValues[property?.propertyValue] = filterValue.trim().toLowerCase();

    // Si todos los filtros están vacíos, reseteamos a 0 de inmediato
    const allEmpty = Object.values(this.filterValues).every((val: any) => !val || val.trim() === '');
    if (allEmpty) {
      this.stockFilter = 0;
      this.conteoFilter = 0;
      this.diferenciaFilter = 0;
    } else {
      this.dataSource.filter = JSON.stringify(this.filterValues);
      const dataFilter = this.dataSource.filteredData;
      this.processDataFilter(dataFilter);
    }

    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  processDataFilter(currentData: any) {
    const totales = currentData.reduce((acc: any, curr: any) => {
      const conteo = toNumber(curr.total_cantidad);
      const dataSearch = this.dataInventario.find(item => item.cCodigoBarra == curr.sku);
      const stock = dataSearch ? toNumber(dataSearch.cStock) : 0;

      return {
        sumaConteo: acc.sumaConteo + conteo,
        sumaStock: acc.sumaStock + stock,
        sumaDiferencia: acc.sumaDiferencia + inventoryDifference(conteo, stock)
      };
    }, { sumaConteo: 0, sumaStock: 0, sumaDiferencia: 0 });

    this.stockFilter = totales.sumaStock;
    this.conteoFilter = totales.sumaConteo;
    this.diferenciaFilter = totales.sumaDiferencia;
  }

  private onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length,
      isError: !!result?.error?.length,
      bodyNotification: result?.message
    }];

    this.invService.onNotification.emit(notificationList);
  }

  exportarExcel() {
    const dataParaExportar = this.dataSource.data.map(item => ({
      'CODBARRAS': item.sku,
      'USUARIO': item.user,
      'ZONA': item.nombre_zona,
      'SUBZONA': item.section_name,
      'UNIDADES': item.total_cantidad * 1,
    }));

    this.dataExportar = dataParaExportar;
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventario': worksheet },
      SheetNames: ['Inventario']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(worksheet['!ref']!)) };
    this.saveAsExcelFile(excelBuffer, 'Cruce_Inventario');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName + '_' + new Date().getTime() + '.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  tabIndex = 0;
  onTabChange(index: number) {
    this.tabIndex = index;
  }
}