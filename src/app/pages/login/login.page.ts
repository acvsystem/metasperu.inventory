import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Nota: Si no usas la versión standalone pura, importa desde '@ionic/angular'

import { addIcons } from 'ionicons'; // Para registrar iconos
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonLabel,
  IonItem,
  IonInput,
  IonIcon,
  IonCheckbox,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'mt-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // 2. AGREGARLOS AQUÍ
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonLabel,
    IonItem,
    IonInput,
    IonIcon,
    IonCheckbox,
    IonButton
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {

  showPassword = false;

  constructor() {
    // 3. REGISTRAR LOS ICONOS QUE USASTE
    addIcons({ eyeOutline, eyeOffOutline });

    console.log("LOGIN");
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

}
