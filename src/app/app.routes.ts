import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login') },
  {
    path: 'inventory',
    canActivateChild: [authGuard], // <--- Protege a todos los hijos de un solo golpe
    loadComponent: () => import('./features/inventory/pages/main/main'),
    children: [
      {
        path: 'dashboard/:code/:serie',
        loadComponent: () => import('./features/inventory/pages/dashboard/dashboard'),
        data: { roles: ['administrador', 'auditor'] }
      },
      {
        path: 'session',
        loadComponent: () => import('./features/inventory/pages/inventory-session/inventory-session'),
        data: { roles: ['administrador', 'auditor'] }
      },
      {
        path: 'pocket',
        loadComponent: () => import('./features/inventory/pages/pocket/pocket'),
        data: { roles: ['administrador', 'auditor', 'pocket'] }
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./features/maintenance/maintenance'),
        data: { roles: ['administrador', 'auditor'] }
      },
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];