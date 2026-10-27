import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable, map, firstValueFrom } from 'rxjs';
import { InventoryService } from '@metasperu/services/inventory.service';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';
import { db } from '../../core/db/offline-db';
export interface User {
  id: number | string;
  username: string;
  role: 'administrador' | 'auditor' | 'pocket';
  perfilname?: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private invService = inject(InventoryService);
  private sockets = inject(InventorySocketService);
  private readonly API_URL = 'https://api.metasperu.net.pe/s2/auth';
  #user = signal<User | null>(null);
  user = this.#user.asReadonly();
  isAuthenticated = computed(() => !!this.#user());
  canAdminister = computed(() => this.#user()?.role === 'administrador');
  currentUser = signal<string | null>(null);
  private acceptUser(user: User) {
    if (!user || !['administrador', 'auditor', 'pocket'].includes(user.role))
      throw new Error('Sesión inválida.');
    localStorage.removeItem('auth_token');
    localStorage.setItem('role', user.role); // Display cache; authorization uses the server-verified user.
    this.#user.set(user);
    this.currentUser.set(user.username);
    this.invService.onMenu.emit(user.role);
    this.sockets.connect();
  }
  checkSession(): Observable<boolean> {
    return this.http.get<User>(this.API_URL + '/check-session').pipe(
      tap((user) => this.acceptUser(user)),
      map(() => true),
      catchError(() => {
        this.#user.set(null);
        this.currentUser.set(null);
        this.sockets.disconnect();
        return of(false);
      }),
    );
  }
  login(credentials: { username: string; password: string }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(this.API_URL + '/login', credentials).pipe(
      tap((response) => {
        this.acceptUser(response.user);
        this.router.navigate([
          response.user.role === 'pocket' ? '/inventory/pocket' : '/inventory/session',
        ]);
      }),
    );
  }
  async logout() {
    const pending = await db.scans.where('synced').equals(0).count();
    if (
      pending &&
      !confirm(
        'Tienes ' +
          pending +
          ' escaneos sin subir al servidor. Si cierras sesión se perderán. ¿Cerrar de todos modos?',
      )
    )
      return;
    try {
      await firstValueFrom(this.http.post(this.API_URL + '/logout', {}));
    } catch (error: any) {
      if (error.status !== 401) {
        alert('No se pudo cerrar la sesión en el servidor. Reintenta con conexión.');
        return;
      }
    }
    this.sockets.disconnect();
    await db.scans.clear();
    for (const key of [
      'auth_token',
      'role',
      'codeSession',
      'pocketCode',
      'offline_inventory',
      'serieStore',
    ])
      localStorage.removeItem(key);
    this.#user.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  expireSession() {
    // Pending offline scans survive an expired network session.
    this.#user.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('role');
    this.sockets.disconnect();
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}
