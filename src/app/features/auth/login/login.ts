import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/auth/auth.service';
import { FormsModule } from '@angular/forms';
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
  IonButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'mt-login',
  standalone: true,
  imports: [
    CommonModule, IonicModule, ReactiveFormsModule,
    FormsModule,
    IonicModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export default class LoginPage {
  private fb = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  isLoading = signal(false);
  showPassword = false;
  userName: string = "";
  password: string = "";

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor() {
    // 3. REGISTRAR LOS ICONOS QUE USASTE
    addIcons({ eyeOutline, eyeOffOutline });

    console.log("LOGIN");
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.presentToast('Bienvenido al sistema', 'success');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.presentToast('Usuario o contraseña incorrectos', 'danger');
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }


}
