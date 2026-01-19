import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login') },
  {
    path: 'inventory',
    canActivate: [authGuard], // <--- Protección aquí
    loadComponent: () => import('./features/inventory/pages/inventory-session/inventory-session')
  },
  {
    path: 'inventory/session',
    canActivate: [authGuard], // <--- Protección aquí
    loadComponent: () => import('./features/inventory/pages/inventory-session/inventory-session'),
  },
  {
    path: 'inventory/dashboard/:code',
    canActivate: [authGuard], // <--- Protección aquí
    loadComponent: () => import('./features/inventory/pages/inventory-session/inventory-session'),
  },
  {
    path: 'inventory/pocket',
    canActivate: [authGuard], // <--- Protección aquí
    loadComponent: () => import('./features/inventory/pages/pocket/pocket'),
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