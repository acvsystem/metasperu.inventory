import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. CORRECCIÓN: Importar MenuController desde /standalone
import { MenuController } from '@ionic/angular/standalone';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  chevronDownOutline,
  notificationsOutline,
  settingsOutline,
  logOutOutline
} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonMenu, IonMenuButton, IonList, // Agregué IonList si lo usas
  IonAvatar, IonIcon, IonButtons, IonPopover, IonMenuToggle // Agregué los que faltaban según tu HTML previo
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { StorageService } from '@metasperu/services/store.service';
import { ToasNotification } from '@metasperu/component/toas-notification/toas-notification';
import { InventoryService } from '@metasperu/services/inventory.service';

@Component({
  selector: 'main-layout',
  standalone: true, // Asegúrate de tener esto
  imports: [
    CommonModule,
    RouterOutlet,
    ToasNotification,
    // 2. CORRECCIÓN: Solo importa los componentes específicos necesarios
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
    IonLabel, IonButton, IonMenu, IonMenuButton, IonList,
    IonAvatar, IonIcon, IonButtons, IonPopover, IonMenuToggle
    // ELIMINÉ IonicModule porque causa conflicto con los Standalone
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss'
})
export default class MainComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  // 3. Ahora este controlador sí tendrá autoridad sobre los componentes standalone
  private menuCtrl = inject(MenuController);
  private store = inject(StorageService);
  private invService = inject(InventoryService);
  menuFiltrado: Array<any> = [];
  user = this.authService.currentUser;
  arMenuList = [
    { nombre_menu: 'DASHBOARD', ruta: 'inventory/dashboard', roles: ['administrador', 'auditor'] },
    { nombre_menu: 'SESIONES', ruta: 'inventory/session', roles: ['administrador', 'auditor'] },
    { nombre_menu: 'POCKET', ruta: 'inventory/pocket', roles: ['administrador', 'pocket'] },
    { nombre_menu: 'CONFIGURACION', ruta: 'inventory/maintenance', roles: ['administrador', 'auditor'] }
  ];

  constructor() {


    addIcons({
      chevronDownOutline,
      notificationsOutline,
      settingsOutline,
      logOutOutline
    });
  }



  ngOnInit() {
    const userRole = localStorage.getItem('role'); // O de tu servicio de Auth
    this.menuFiltrado = this.arMenuList.filter(item => item.roles.includes(userRole as any));

    this.invService.onMenu.subscribe((rol) => {
      const role = rol || userRole;
      this.menuFiltrado = this.arMenuList.filter(item => item.roles.includes(role));
      this.redireccionarPorRol(role);
    });
  }

  redireccionarPorRol(role: string) {
    switch (role) {
      case 'administrador':
        this.onNavigatorRoute('inventory/session');
        break;
      case 'auditor':
        this.onNavigatorRoute('inventory/session');
        break;
      case 'pocket':
        this.onNavigatorRoute('inventory/pocket');
        break;
      default:
        this.onNavigatorRoute('inventory/dashboard');
        break;
    }
  }

  logout() {
    this.authService.logout();
    localStorage.clear();
  }

  async onNavigatorRoute(route: string) {
    // 4. Intentar cerrar con el ID 'first' que tienes en el HTML
    try {
      await this.menuCtrl.close('first');
    } catch (error) {
      console.log('Error cerrando menú:', error);
    }

    // Limpieza de bloqueos de accesibilidad
    document.getElementById('app-root')?.removeAttribute('aria-hidden');
    document.body.removeAttribute('aria-hidden');

    if (route === 'inventory/dashboard') {
      const codeSession = this.store.getStore('codeSession');
      const serieStore = this.store.getStore('serieStore');
      this.router.navigate([`/${route}`, codeSession?.value, serieStore?.value]);
    } else {
      this.router.navigate([`/${route}`]);
    }

  }
}