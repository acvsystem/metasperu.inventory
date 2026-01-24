import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login') },
  {
    path: 'inventory',
    canActivate: [authGuard], // <--- Protección aquí
    loadComponent: () => import('./features/inventory/pages/main/main'),
    children: [
      {
        path: 'dashboard/:code/:serie',
        loadComponent: () => import('./features/inventory/pages/dashboard/dashboard')
      },
      {
        path: 'session',
        loadComponent: () => import('./features/inventory/pages/inventory-session/inventory-session')
      },
      {
        path: 'pocket',
        loadComponent: () => import('./features/inventory/pages/pocket/pocket')
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/maintenance/maintenance')
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];