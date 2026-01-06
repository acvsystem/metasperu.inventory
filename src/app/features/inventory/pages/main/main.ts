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
  IonLabel, IonButton  
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

@Component({
  selector: 'main-layout',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, 
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
  constructor() {
    addIcons({
      chevronDownOutline,
      notificationsOutline,
      settingsOutline,
      logOutOutline
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error en logout', err);
        this.router.navigate(['/login']);
      }
    });
  }

  onNavigatorRoute(route: string) {
    this.menuCtrl.close();
    if (route == 'inventory/dashboard') {
      this.router.navigate([`/${route}`, 'KBS79J']);
    } else {
      this.router.navigate([`/${route}`]);
    }

  }
}