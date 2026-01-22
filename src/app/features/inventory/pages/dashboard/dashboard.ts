import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonCard, IonList, IonItem, IonLabel, IonBadge,
  IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
  AlertController, ToastController, IonListHeader, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { radioOutline, cubeOutline, barcodeOutline, refreshOutline, checkmarkDoneCircle, hourglassOutline } from 'ionicons/icons';
import { MatTabsModule } from '@angular/material/tabs';
import { InventoryService } from '@metasperu/services/inventory.service';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';
import { View2Inventario } from './component/view-2-inventario/view-2-inventario'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, View2Inventario, MatTabsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
    IonCol, IonCard, IonList, IonItem, IonLabel, IonBadge, IonListHeader,
    IonButtons, IonBackButton, IonButton, IonIcon, IonChip, IonCardContent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export default class DashboardComponent implements OnInit {
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
  products = signal<any[]>([]);
  isLoading = signal(false);
  dataInventario: Array<any> = [];
  // Signals computados (se actualizan solos cuando 'products' cambia)
  totalUnidades = computed(() =>
    this.products().reduce((acc, curr) => acc + Number(curr.total_cantidad), 0)
  );

  constructor() {
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

      this.dataInventario = this.socketService.syncInventarioStore();
    });
  }

  ngOnInit() {
    // Obtener el código de la URL: /admin/dashboard/XYZ123
    this.sessionCode = this.route.snapshot.paramMap.get('code') || '';
    this.serieStore = this.route.snapshot.paramMap.get('serie') || '';

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
        console.log(res);
        this.pocketScan = res.products;
        this.products.set(res.products);
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
}