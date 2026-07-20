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
export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
  id?: number;
}

const sectionColumnKey = (name: string) => (name || '').trim().replace(/\s+/g, '_').toLowerCase();

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, View2Inventario, MatTabsModule, Statistics, MatBadgeModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, MatSidenavModule,
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
  dataInventario: Array<any> = [];
  arAsignatedSections: Array<any> = [];
  dataSource = new MatTableDataSource(this.products());
  filterValues: any = {};
  displayedColumns = ['sku', 'usuario', 'seccion', 'cantidad', 'accion'];
  dataColumns: tableColumns[] = [
    { matColumnDef: 'sku', titleColumn: 'Sku', propertyValue: 'sku', filterActive: false, id: 0 },
    { matColumnDef: 'usuario', titleColumn: 'Usuario', propertyValue: 'user', filterActive: false, id: 0 },
    { matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'section_name', filterActive: false, id: 0 },
    { matColumnDef: 'cantidad', titleColumn: 'Cantidad', propertyValue: 'total_cantidad', filterActive: false, id: 0 },
    { matColumnDef: 'accion', titleColumn: 'Accion', propertyValue: '', filterActive: false, id: 0 }];

  totalUnidades = computed(() =>
    this.products().reduce((acc, curr) => acc + Number(curr.total_cantidad), 0)
  );

  constructor(public dialog: MatDialog, private socketInv: InventorySocketService) {

    // Registrar iconos de Ionic
    addIcons({ radioOutline, cubeOutline, barcodeOutline, refreshOutline, checkmarkDoneCircle, hourglassOutline });

    // Efecto reactivo: Cuando el socket reciba una actualización, refrescamos los datos
    effect(() => {
      const notification = this.socketService.syncNotification();

      if (notification) {
        // 1. Recargamos la tabla principal para ver los nuevos totales
        this.loadData();

        // 2. Opcional: Mostrar un Toast rápido informando cuántos productos llegaron
        this.presentToast(`Se sincronizaron ${notification.count} productos nuevos.`);
      }

      if (!this.isDatabase) {
        this.dataInventario = this.socketService.syncInventarioStore();
      }

    });
  }

  ngOnInit() {
    // Obtener el código de la URL: /admin/dashboard/XYZ123
    this.sessionCode = this.route.snapshot.paramMap.get('code') || '';
    this.serieStore = this.route.snapshot.paramMap.get('serie') || '';
    //this.asignedSections();

    if (!this.sessionCode) {
      this.router.navigate(['/inventory/session']);
      return;
    }

    // Unirse a la sala de socket para recibir actualizaciones en tiempo real
    this.socketService.joinSession(this.sessionCode);
    this.asignedSections();
    const offlineData = localStorage.getItem('offline_inventory');

    if (!offlineData) {
      this.loadInventary();
    }

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every(columnKey => {
        const cellValue = data[columnKey]?.toString().toLowerCase() || '';
        return cellValue.includes(searchTerms[columnKey]);
      });
    };
  }


  loadInventary() {

    this.invService.getStoreInventory({ session_code: this.sessionCode, serie_store: this.serieStore }).subscribe({
      next: (res: any) => {
        if (Object.keys(res).includes('inventario')) {
          localStorage.removeItem('offline_inventory');
          this.dataInventario = [];
          const inventario = res?.inventario;
          console.log('📦 Inventario recibido bd:', inventario.length);
          this.isDatabase = true;
          this.dataInventario = inventario;
        }
      },
      error: (err) => { console.log(err); }
    });
  }
  /**
   * Carga los datos acumulados de la sesión desde el backend
   */
  loadData() {
    this.isLoading.set(true);

    this.invService.getSessionSummary(this.sessionCode).subscribe({
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
            section_name: seccionObj ? seccionObj.nombre_seccion : 'DESCONOCIDO'
          };

          this.arAsignatedSections.forEach((section) => {
            const sectionKey = sectionColumnKey(section.nombre_seccion);
            objReturn[sectionKey] = seccionObj?.id === section.id ? Number(item.total_cantidad) || 0 : 0;
          });

          return objReturn;
        }).reverse();

        this.totalSkusCount.set(products.length); // Total de registros
        this.uniqueSkusCount.set(uniqueSkusSet.size); // SKUs sin repetir

        this.pocketScan = formattedData;
        this.products.set(formattedData);

        this.dataSource.data = this.products();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.isLoading.set(false);
      },
      error: (err) => {

        this.isLoading.set(false);
      }
    });
  }

  /**
   * Muestra confirmación para cerrar el inventario
   */
  async confirmCloseSession() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Inventario',
      message: '¿Estás seguro de finalizar esta sesión? Los operarios ya no podrán enviar más escaneos.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Finalizar',
          handler: () => this.closeSession()
        }
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
    const { id, value } = data;
    this.inFilter = value ?? "";
    const filterValue = value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyFilterTable(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;

    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);
    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;
    this.filterValues[property?.propertyValue] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  private onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length ? true : false,
      isError: result?.error?.length ? true : false,
      bodyNotification: result?.message
    }];

    this.invService.onNotification.emit(notificationList);
  }

  exportarExcel() {
    // 1. Mapeamos los datos para que el Excel tenga nombres de columnas bonitos
    const dataParaExportar = this.dataSource.data.map(item => {
      return {
        'Código de Barras': item.sku,
        'Usuario': item.user,
        'Seccion': item.section_name,
        'Conteo': item.total_cantidad * 1,
      };
    });

    // 2. Creamos el libro y la hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventario': worksheet },
      SheetNames: ['Inventario']
    };

    // 3. Generamos el archivo y lo descargamos
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
