import { Component } from '@angular/core';
import { Sections } from './component/sections/sections';
import { Users } from './component/users/users';
import { MatTabsModule } from '@angular/material/tabs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonCard, IonList, IonItem, IonLabel, IonBadge,
  IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
  AlertController, ToastController, IonListHeader, IonCardContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-maintenance',
  imports: [Sections, MatTabsModule, IonContent, Users],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export default class Maintenance {
  roleUser: any = "";
  ngOnInit() {
    const userRole = localStorage.getItem('role');
    this.roleUser = userRole;
  }
}
