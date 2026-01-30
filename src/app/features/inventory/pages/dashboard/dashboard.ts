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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, View2Inventario, MatTabsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
    IonCol, IonCard, IonLabel, IonListHeader, MatIconModule,
    IonButtons, IonButton, IonIcon, IonChip, IonCardContent, MatTableModule,
    MatPaginator, MatPaginatorModule, MatSortModule, MtInput
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
  sessionCode = '';
  serieStore = '';
  pocketScan: any;
  inFilter: string = "";
  products = signal<any[]>([]);
  isLoading = signal(false);
  dataInventario: Array<any> = [];
  arAsignatedSections: Array<any> = [];
  dataSource = new MatTableDataSource(this.products());
  displayedColumns: string[] = ['sku', 'usuario', 'seccion', 'cantidad',];
  totalUnidades = computed(() =>
    this.products().reduce((acc, curr) => acc + Number(curr.total_cantidad), 0)
  );

  constructor() {

    // Registrar iconos de Ionic
    addIcons({ radioOutline, cubeOutline, barcodeOutline, refreshOutline, checkmarkDoneCircle, hourglassOutline });

    // Efecto reactivo: Cuando el socket reciba una actualización, refrescamos los datos
    effect(() => {
      const notification = this.socketService.syncNotification();
      this.asignedSections();
      if (notification) {
        // 1. Recargamos la tabla principal para ver los nuevos totales
        this.loadData();

        // 2. Opcional: Mostrar un Toast rápido informando cuántos productos llegaron
        this.presentToast(`Se sincronizaron ${notification.count} productos nuevos.`);
      }

      this.dataInventario = this.socketService.syncInventarioStore();
    });
  }

  ngOnInit() {
    // Obtener el código de la URL: /admin/dashboard/XYZ123
    this.sessionCode = this.route.snapshot.paramMap.get('code') || '';
    this.serieStore = this.route.snapshot.paramMap.get('serie') || '';
    this.asignedSections();
    this.loadData();
    if (!this.sessionCode) {
      this.router.navigate(['/admin/sessions']);
      return;
    }

    // Unirse a la sala de socket para recibir actualizaciones en tiempo real
    this.socketService.joinSession(this.sessionCode);

    this.invService.getStoreInventory({ session_code: this.sessionCode, serie_store: this.serieStore }).subscribe({
      next: (res) => {
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

        const formattedData = products.map((item: any) => {
          const seccionObj = this.arAsignatedSections.find(s => s.id === item.seccion_id);

          const objReturn: Record<string, any> = {
            seccion_id: item.seccion_id,
            sku: item.sku,
            user: item.usuario,
            total_cantidad: item.total_cantidad,
            ultimo_escaneo: item.ultimo_escaneo,
            veces_escaneado: item.veces_escaneado,
            section_name: seccionObj ? seccionObj.nombre_seccion : 'DESCONOCIDO'
          };

          this.arAsignatedSections.map((section) => {
            objReturn[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = seccionObj.nombre_seccion == section.nombre_seccion ? item.total_cantidad : 0;
          });



          return objReturn;
        }).reverse();

        this.pocketScan = formattedData;
        this.products.set(formattedData);

        this.dataSource.data = this.products();
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando resumen:', err);
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
    this.presentToast('Sesión de inventario cerrada correctamente.');
    this.router.navigate(['/admin/sessions']);
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
        'Conteo': item.total_cantidad,
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
}