import { Component } from '@angular/core';
import { Sections } from './component/sections/sections';
import { MatTabsModule } from '@angular/material/tabs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonCard, IonList, IonItem, IonLabel, IonBadge,
  IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
  AlertController, ToastController, IonListHeader, IonCardContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-maintenance',
  imports: [Sections, MatTabsModule, IonContent],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export default class Maintenance {

}
