import { Routes } from '@angular/router';
import { LoginPage } from './login.page';

// 💡 CLAVE: Esta constante es la que se importa en app-routing.module.ts
export const LoginRoutes: Routes = [
  {
    path: '', // Esto define la ruta final como '/login'
    component: LoginPage
  }
];