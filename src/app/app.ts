import { ThemeService } from './shared/services/theme.service';
import { Component, signal, inject } from '@angular/core';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [IonRouterOutlet, IonApp],
})
export class App {
  readonly theme = inject(ThemeService);

  showPass = 'password';

  protected readonly title = signal('metasperu.inventory');

  showPassword = false;

  constructor() {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
