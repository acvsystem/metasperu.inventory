import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    // Usamos el lazy loading (carga perezosa) para la página de login
    loadChildren: () => import('./pages/login/login.routes').then(m => m.LoginRoutes),
  },
  // Aquí se agregarán más rutas, como '/home'
];