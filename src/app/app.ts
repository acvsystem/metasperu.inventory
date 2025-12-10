import { Component, signal } from '@angular/core';
import { IonRouterOutlet, IonApp } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [
    IonRouterOutlet, IonApp
  ],
})
export class App {



  showPass = 'password';

  protected readonly title = signal('metasperu.inventory');


  showPassword = false;

  constructor() {
    console.log("APP");
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
