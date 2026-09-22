import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ViewChild } from '@angular/core';
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
import { View2Inventario } from './component/view-2-inventario/view-2-inventario';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import * as XLSX from 'xlsx';
import { MatIconModule } from '@angular/material/icon';
import { Statistics } from '../dashboard/component/statistics/statistics';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { ModalConteo } from './component/modal-conteo/modal-conteo';
import { MatBadgeModule } from '@angular/material/badge';
import { View3Inventario } from './component/view-3-inventario/view-3-inventario';
import { MtLoader } from '@metasperu/component/mt-loader/mt-loader';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';

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
    MatPaginator, MatPaginatorModule, MatSortModule, MtInput, MatMenuModule, MtSelect
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export default class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ====================== INYECCIONES ======================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invService = inject(InventoryService);
  public socketService = inject(InventorySocketService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  public dialog = inject(MatDialog);

  // ====================== ESTADO ======================
  isDatabase = false;
  sessionCode = '';
  serieStore = '';
  pocketScan: any;
  inFilter = '';
  products = signal<any[]>([]);
  totalSkusCount = signal(0);
  uniqueSkusCount = signal(0);
  isLoading = signal(false);
  isLoading2 = signal(true);
  titleLoader = 'Cargando Inventario...';

  totalStock = signal(0);
  totalConteo = signal(0);
  totalDiferencia = signal(0);

  stockFilter = 0;
  conteoFilter = 0;
  diferenciaFilter = 0;

  dataInventario: any[] = [];
  arAsignatedSections: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  filterValues: any = {};
  allDataProcess: any[] = [];
  dataExportar: any[] = [];
  cboSections: any[] = [];
  displayedColumns = ['sku', 'usuario', 'zona', 'subzona', 'cantidad', 'accion'];
  dataColumns: tableColumns[] = [
    { matColumnDef: 'sku', titleColumn: 'Sku', propertyValue: 'sku', filterActive: false, id: 0 },
    { matColumnDef: 'usuario', titleColumn: 'Usuario', propertyValue: 'user', filterActive: false, id: 0 },
    { matColumnDef: 'zona', titleColumn: 'Zona', propertyValue: 'nombre_zona', filterActive: false, id: 0 },
    { matColumnDef: 'subzona', titleColumn: 'Subzona', propertyValue: 'section_name', filterActive: false, id: 0 },
    { matColumnDef: 'cantidad', titleColumn: 'Cantidad', propertyValue: 'total_cantidad', filterActive: false, id: 0 },
    { matColumnDef: 'accion', titleColumn: 'Accion', propertyValue: '', filterActive: false, id: 0 }
  ];

  // ====================== COMPUTED ======================
  totalUnidades = computed(() =>
    this.products().reduce((acc, curr) => acc + Number(curr.total_cantidad || 0), 0)
  );

  pendingCount = computed(() => this.socketService.pendingCount());

  private autoSyncInterval: any;

  constructor() {
    addIcons({
      radioOutline,
      cubeOutline,
      barcodeOutline,
      refreshOutline,
      checkmarkDoneCircle,
      hourglassOutline
    });

    // Solo reaccionamos al inventario de tienda (stock)
    effect(() => {
      const inventarioSocket = this.socketService.syncInventarioStore();
      if (inventarioSocket?.length) {
        this.setCachedInventory(inventarioSocket);
        this.dataInventario = inventarioSocket;
        this.isDatabase = true;
        this.isLoading2.set(false);
        this.onLoadInventarioHeader();
      }
    });
  }

  // ====================== CICLO DE VIDA ======================
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
      this.isLoading2.set(false);
    } else if (cachedInventario?.length) {
      this.dataInventario = cachedInventario;
      this.isDatabase = true;
      this.isLoading2.set(false);
      this.onLoadInventarioHeader();
    } else {
      this.loadInventary();
    }

    // Filtro personalizado de la tabla
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let searchCriteria: any = {};
      try {
        searchCriteria = JSON.parse(filter);
      } catch {
        searchCriteria = {};
      }

      let hasActiveFilters = false;

      for (const column in searchCriteria) {
        const searchValue = searchCriteria[column];
        if (!searchValue || searchValue.trim() === '') continue;

        hasActiveFilters = true;
        const cellValue = data[column] ? data[column].toString().toLowerCase() : '';

        if (searchValue.endsWith(' ')) {
          const exactWord = searchValue.trim();
          const wordsInCell = cellValue.split(' ');
          if (!wordsInCell.includes(exactWord)) return false;
        } else {
          if (column === 'section_name' || column === 'sku') {
            if (cellValue !== searchValue.trim()) return false;
          } else {
            if (!cellValue.includes(searchValue.trim())) return false;
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

    // Auto-sincronizar cada 45 segundos si hay pendientes
    /* this.autoSyncInterval = setInterval(() => {
       if (this.pendingCount() > 0 && !this.isLoading()) {
         this.sincronizar(true); // true = silencioso
       }
     }, 45000);*/
  }

  ngOnDestroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
  }

  // ====================== SINCRONIZAR ======================
  /**
   * Este es el único lugar donde se llama a loadData() por los sockets.
   * El usuario presiona el botón o se ejecuta automáticamente cada 45s.
   */
  sincronizar(silent = false) {
    if (this.pendingCount() === 0) {
      if (!silent) {
        this.presentToast('No hay escaneos pendientes.');
      }
      return;
    }

    const cantidad = this.pendingCount();

    // Mostramos el loader
    this.isLoading2.set(true);
    this.titleLoader = 'Sincronizando escaneos...';

    this.loadData(() => {
      // Esta función se ejecuta cuando loadData termina
      this.socketService.clearPending();
      this.isLoading2.set(false);

      if (!silent) {
        this.presentToast(`Se sincronizaron ${cantidad} productos.`);
      }
    });
  }

  // ====================== CARGA DE DATOS ======================
  loadData(onComplete?: () => void) {
    this.isLoading.set(true);

    this.invService.getSessionSummaryv2(this.sessionCode).subscribe({
      next: (res) => {
        const products = res.products || [];
        const uniqueSkusSet = new Set<string>();
        const sectionsById = new Map(this.arAsignatedSections.map(s => [s.id, s]));

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
            objReturn[sectionKey] = seccionObj?.id === section.id
              ? Number(item.total_cantidad) || 0
              : 0;
          });

          return objReturn;
        }).reverse();

        this.totalSkusCount.set(products.length);
        this.uniqueSkusCount.set(uniqueSkusSet.size);
        this.pocketScan = formattedData;
        this.products.set(formattedData);

        this.dataSource.data = formattedData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.dataExportar = formattedData.map((item: any) => ({
          'CODBARRAS': item.sku,
          'USUARIO': item.user,
          'ZONA': item.nombre_zona,
          'SUBZONA': item.section_name,
          'UNIDADES': item.total_cantidad * 1
        }));

        this.totalDiferencia.set(this.totalUnidades() - this.totalStock());
        this.isLoading.set(false);

        // Ejecutamos el callback si existe (para quitar el loader)
        if (onComplete) {
          onComplete();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoading2.set(false); // por si acaso
        this.presentToast('Error al cargar los datos de la sesión.');

        if (onComplete) {
          onComplete();
        }
      }
    });
  }

  loadInventary() {
    this.isLoading2.set(true);

    this.invService.getStoreInventory({
      session_code: this.sessionCode,
      serie_store: this.serieStore
    }).subscribe({
      next: (res: any) => {
        if (res?.inventario) {
          localStorage.removeItem('offline_inventory');
          this.dataInventario = res.inventario;
          this.isDatabase = true;
          this.setCachedInventory(res.inventario);
          this.onLoadInventarioHeader();
        }
        this.isLoading2.set(false);
      },
      error: () => {
        this.isLoading2.set(false);
        const cached = this.getCachedInventory();
        if (cached?.length) {
          this.dataInventario = cached;
          this.isDatabase = true;
          this.presentToast('No se pudo actualizar. Se muestra el inventario guardado.');
        }
      }
    });
  }

  onLoadInventarioHeader() {
    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;

    this.dataInventario.forEach(item => {
      totalStockGlobal += toNumber(item.cStock);
      totalConteoGlobal += toNumber(item.cConteo);
    });

    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(this.totalUnidades() - totalStockGlobal);
  }

  // ====================== CACHE LOCAL ======================
  private get inventoryCacheKey() {
    const serie = this.serieStore || 'sin-serie';
    return `store_inventory_cache_${this.sessionCode}_${serie}`;
  }

  private getCachedInventory(): any[] {
    try {
      const cached = localStorage.getItem(this.inventoryCacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
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

  // ====================== SECCIONES ======================
  private asignedSections() {
    this.invService.getAssignedSections(this.sessionCode).subscribe({
      next: (res) => {
        console.log(res);
        this.arAsignatedSections = res || [];
        this.cboSections = [];
        res.map((section: any) => {
          this.cboSections.push({ key: section.id, value: section.nombre_seccion, id: section.seccion_id_fk });
        });

        this.loadData(); // Primera carga de la tabla
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  deleteSectionConteo() {
    this.invService.delSectionConteo(this.sessionCode, this.selectedSectionId).subscribe({
      next: (res) => {
        console.log(res);
        this.loadData();
        this.onNotification(res);
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }


  // ====================== FILTROS ======================
  applyFilter(data: any) {
    if (!data) return;
    const { value } = data;
    this.inFilter = value ?? '';
    this.dataSource.filter = value.trim().toLowerCase();
  }

  applyFilterTable(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;
    const property = this.dataColumns.find(t => t.matColumnDef === column);
    const indexHeader = this.dataColumns.findIndex(t => t.matColumnDef === column);

    if (indexHeader >= 0) {
      this.dataColumns[indexHeader].filterActive = !!filterValue.length;
    }

    this.filterValues[property?.propertyValue || column] = filterValue.trim().toLowerCase();

    const allEmpty = Object.values(this.filterValues).every((val: any) => !val || val.trim() === '');
    if (allEmpty) {
      this.stockFilter = 0;
      this.conteoFilter = 0;
      this.diferenciaFilter = 0;
    } else {
      this.dataSource.filter = JSON.stringify(this.filterValues);
      this.processDataFilter(this.dataSource.filteredData);
    }

    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  processDataFilter(currentData: any[]) {
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

  // ====================== OTROS MÉTODOS ======================
  onAllDataProcess(data: any[]) {
    this.allDataProcess = data;
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
            }
          });
        }
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

  private async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }

  private onNotification(result: any) {
    const notificationList = [{
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
      'UNIDADES': item.total_cantidad * 1
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventario': worksheet },
      SheetNames: ['Inventario']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'Cruce_Inventario');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  tabIndex = 0;
  onTabChange(index: number) {
    this.tabIndex = index;
  }
  selectedSection: any = {};
  selectedSectionId: any = 0;

  async onChangeSelect(data: any) {
    const selectData = data || {};
    this.selectedSection = selectData;
    this.selectedSectionId = (selectData || {}).key || 0;
  }

  importExcelInventario(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
        const codStore = localStorage.getItem('serieStore');
        // Mapeo según la estructura de tu tabla inventario_store
        const formattedData = rawData.map(item => ({
          cSessionCode: this.sessionCode,           // Se fuerza el código de sesión actual
          codigo_sesion: this.sessionCode,          // Por si tu API también lo usa
          cCodigoTienda: codStore || item['Código Tienda'] || null,
          cCodigoArticulo: item.cCodigoArticulo || item['Código Artículo'] || null,
          cReferencia: item.cReferencia || item.Referencia || null,
          cCodigoBarra: item.cCodigoBarra || item['Código Barra'] || null,
          cCodigoBarra2: item.cCodigoBarra2 || item['Código Barra 2'] || null,
          cCodigoBarra3: item.cCodigoBarra3 || item['Código Barra 3'] || null,
          cDescripcion: item.cDescripcion || item.Descripción || item.Descripcion || null,
          cDepartamento: item.cDepartamento || item.Departamento || null,
          cSeccion: item.cSeccion || item.Sección || item.Seccion || null,
          cFamilia: item.cFamilia || item.Familia || null,
          cSubFamilia: item.cSubFamilia || item['Sub Familia'] || item.SubFamilia || null,
          cTalla: item.cTalla || item.Talla || null,
          cColor: item.cColor || item.Color || null,
          cEsencia: item.cEsencia || item.Esencia || null,
          cStyleDescription: item.cStyleDescription || item.cStyleDesc || item['Style Description'] || null,
          cStock: Number(item.cStock) || 0,
          cTemporada: item.cTemporada || item.Temporada || '',
          cConteo: Number(item.cConteo) || 0,
          cTotalConteo: inventoryDifference(item.cConteo, item.cStock), // Calcula la diferencia
          checking: 0
        }));

        console.log('Datos formateados:', formattedData);

        // Enviar a la API
        await this.enviarInventarioAApi(formattedData);

      } catch (error) {
        console.error('Error al procesar el Excel:', error);
        // Aquí puedes mostrar un toast o alerta
      }
    };

    reader.readAsArrayBuffer(file);
  }

  async enviarInventarioAApi(formattedData: any[]) {
    try {
      const response = await this.invService.impInventarioSession(
        this.sessionCode,
        formattedData
      ).toPromise();

      this.onNotification(response);
      setTimeout(() => {
        this.loadInventary();
      }, 1000);
      // Aquí puedes mostrar un mensaje de éxito
    } catch (error) {
      console.error('Error al importar:', error);
    }
  }


  importExcelConteo(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // limpiar input para poder reimportar el mismo archivo
    event.target.value = '';

    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (!rawData.length) {
          console.warn('El Excel está vacío');
          return;
        }

        // Mapeo → API resuelve subzona/usuario a IDs en el backend
        const items = rawData
          .map((row) => {
            const sku = (
              row.sku ??
              row.SKU ??
              row.codbarra ??
              row.CODIGO_BARRA ??
              row.cCodigoBarra ??
              row.codigo_barra ??
              ''
            )
              .toString()
              .trim();

            const cantidad = Number(
              row.cantidad ??
              row.CANTIDAD ??
              row.qty ??
              row.quantity ??
              row.unidades ??
              0
            );

            const subzona = (
              row.subzona ??
              row.SUBZONA ??
              row.seccion ??
              row.SECCION ??
              row.nombre_seccion ??
              ''
            )
              .toString()
              .trim();

            const usuario = (
              row.usuario ??
              row.USUARIO ??
              row.username ??
              row.USERNAME ??
              ''
            )
              .toString()
              .trim();

            return { sku, cantidad, subzona, usuario };
          })
          .filter((item) => item.sku && Number.isFinite(item.cantidad) && item.cantidad > 0);

        if (!items.length) {
          console.warn('No hay filas válidas (sku + cantidad > 0)');
          return;
        }

        console.log(`Filas a importar: ${items.length}`, items.slice(0, 5));

        const sessionCode = this.sessionCode;

        this.invService.impConteoSession(sessionCode, items).subscribe({
          next: (res) => {
            console.log('Import OK:', res);
            this.onNotification(res);
            this.loadData();
          },
          error: (err) => {
            console.error('Error al importar conteo:', err);
            this.onNotification(err);
          }
        });
      } catch (error) {
        console.error('Error al procesar el Excel:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  }

}