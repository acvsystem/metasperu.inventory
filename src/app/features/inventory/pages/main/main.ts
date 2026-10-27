import { ThemeService } from '../../../../shared/services/theme.service';
import { PocketChat } from '../../../../shared/component/pocket-chat/pocket-chat';
import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { inventoryPaginator } from '../../../../shared/component/inventory-paginator';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  MenuController,
  IonContent,
  IonHeader,
  IonToolbar,
  IonItem,
  IonLabel,
  IonButton,
  IonMenu,
  IonMenuButton,
  IonList,
  IonIcon,
  IonButtons,
  IonPopover,
  IonMenuToggle,
  IonSplitPane,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronDownOutline,
  settingsOutline,
  logOutOutline,
  wifiOutline,
  cloudOfflineOutline,
  gridOutline,
  listOutline,
  scanOutline,
  cubeOutline,
} from 'ionicons/icons';
import { PocketInventoryService } from '../../../../shared/services/pocket-inventory.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { StorageService } from '@metasperu/services/store.service';
import { ToasNotification } from '@metasperu/component/toas-notification/toas-notification';
import { InventoryService } from '@metasperu/services/inventory.service';

@Component({
  selector: 'main-layout',
  standalone: true,
  providers: [{ provide: MatPaginatorIntl, useFactory: inventoryPaginator }],
  host: { class: 'inventory-ui' },
  imports: [
    CommonModule,
    PocketChat,
    RouterOutlet,
    ToasNotification,
    IonContent,
    IonHeader,
    IonToolbar,
    IonItem,
    IonLabel,
    IonButton,
    IonMenu,
    IonMenuButton,
    IonList,
    IonIcon,
    IonButtons,
    IonPopover,
    IonMenuToggle,
    IonSplitPane,
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export default class MainComponent implements OnInit, OnDestroy {
  readonly theme = inject(ThemeService);
  readonly pocketSettings = inject(PocketInventoryService);
  readonly isOnline = signal(navigator.onLine);
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);
  private store = inject(StorageService);
  private invService = inject(InventoryService);
  private subscriptions = new Subscription();
  readonly currentRoute = signal(this.router.url);
  userRole = '';
  user = this.authService.currentUser;
  arMenuList = [
    {
      nombre_menu: 'Inventarios',
      ruta: 'inventory/session',
      icon: 'list-outline',
      roles: ['administrador', 'auditor'],
    },
    {
      nombre_menu: 'Inventario activo',
      ruta: 'inventory/dashboard',
      icon: 'grid-outline',
      roles: ['administrador', 'auditor'],
    },
    {
      nombre_menu: 'Pocket',
      ruta: 'inventory/pocket',
      icon: 'scan-outline',
      roles: ['administrador', 'auditor', 'pocket'],
    },
    {
      nombre_menu: 'Configuración',
      ruta: 'inventory/maintenance',
      icon: 'settings-outline',
      roles: ['administrador', 'auditor'],
    },
  ];
  menuFiltrado = this.arMenuList.slice(0, 0);
  constructor() {
    addIcons({
      chevronDownOutline,
      settingsOutline,
      logOutOutline,
      wifiOutline,
      cloudOfflineOutline,
      gridOutline,
      listOutline,
      scanOutline,
      cubeOutline,
    });
  }
  ngOnInit() {
    window.addEventListener('online', this.setOnline);
    window.addEventListener('offline', this.setOffline);
    this.setRole(localStorage.getItem('role') || '');
    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) this.currentRoute.set(event.urlAfterRedirects);
      }),
    );
    this.subscriptions.add(
      this.invService.onMenu.subscribe((role) => {
        this.setRole(role || this.userRole);
        this.redireccionarPorRol(this.userRole);
      }),
    );
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    window.removeEventListener('online', this.setOnline);
    window.removeEventListener('offline', this.setOffline);
  }
  private setOnline = () => this.isOnline.set(true);
  private setOffline = () => this.isOnline.set(false);
  private setRole(role: string) {
    this.userRole = role;
    this.menuFiltrado = this.arMenuList.filter((item) => item.roles.includes(role));
  }
  private storedText(key: string) {
    const data = this.store.getStore(key);
    return typeof data === 'object' ? String(data?.value ?? '') : String(data ?? '');
  }
  get activeCode() {
    return this.storedText('codeSession');
  }
  get contextCode() {
    return this.currentRoute().includes('/pocket')
      ? this.storedText('pocketCode')
      : this.currentRoute().includes('/dashboard/')
        ? decodeURIComponent(this.currentRoute().split('/')[3] || '')
        : '';
  }
  get contextStore() {
    return this.currentRoute().includes('/dashboard/')
      ? this.storedText('storeName') ||
          'Tienda ' + decodeURIComponent(this.currentRoute().split('/')[4] || '')
      : '';
  }
  get pageLabel() {
    if (this.currentRoute().includes('/pocket')) return 'Conteo Pocket';
    if (this.currentRoute().includes('/dashboard')) return 'Supervisión de inventario';
    if (this.currentRoute().includes('/maintenance')) return 'Configuración';
    return 'Inventarios de tienda';
  }
  get roleLabel() {
    return this.userRole === 'administrador'
      ? 'Administrador'
      : this.userRole === 'auditor'
        ? 'Auditor'
        : 'Operador Pocket';
  }
  isRouteActive(route: string) {
    return this.currentRoute().startsWith('/' + route);
  }
  redireccionarPorRol(role: string) {
    this.onNavigatorRoute(role === 'pocket' ? 'inventory/pocket' : 'inventory/session');
  }
  logout() {
    this.authService.logout();
  }
  async onNavigatorRoute(route: string) {
    if (route === 'inventory/dashboard' && !this.activeCode) return;
    await this.menuCtrl.close('inventory-menu');
    if (route === 'inventory/dashboard')
      this.router.navigate(['/' + route, this.activeCode, this.storedText('serieStore')]);
    else this.router.navigate(['/' + route]);
  }
}
