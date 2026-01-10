import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  chevronDownOutline,
  notificationsOutline,
  settingsOutline,
  logOutOutline
} from 'ionicons/icons';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonMenu, IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { StorageService } from '@metasperu/services/store.service';

@Component({
  selector: 'main-layout',
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
    IonLabel, IonButton, IonMenu, IonMenuButton,
    CommonModule, IonicModule, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.scss'
})
export default class MainComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  // Datos del usuario desde el Signal de tu servicio
  user = this.authService.currentUser;
  arMenuList = [
    { nombre_menu: 'DASHBOARD', ruta: 'inventory/dashboard' },
    { nombre_menu: 'SESIONES', ruta: 'inventory/session' },
    { nombre_menu: 'POCKET', ruta: 'inventory/pocket' }
  ]
  constructor(private store: StorageService) {
    addIcons({
      chevronDownOutline,
      notificationsOutline,
      settingsOutline,
      logOutOutline
    });
  }

  logout() {
    this.authService.logout()
  }

  onNavigatorRoute(route: string) {
    this.menuCtrl.close();
    if (route == 'inventory/dashboard') {
      const codeSession = this.store.getStore('codeSession');
      this.router.navigate([`/${route}`, codeSession?.value]);
    } else {
      this.router.navigate([`/${route}`]);
    }

  }
}