import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of, Observable, map } from 'rxjs';

// Definimos la interfaz del usuario para tipado fuerte
export interface User {
    id: string;
    usuario: string;
    rol: string;
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private readonly API_URL = 'https://api.metasperu.net.pe/security'; // Ajusta a tu URL

    // 1. Estado reactivo con Signals
    #user = signal<User | null>(null);

    // 2. Selectores públicos (solo lectura)
    user = this.#user.asReadonly();
    isAuthenticated = computed(() => !!this.#user());
    currentUser = signal<any | null>(null);
    /**
     * Intenta recuperar la sesión al cargar la PWA (evita logout al refrescar)
     */
    checkSession(): Observable<boolean> {
        return this.http.get<User>(`${this.API_URL}/check-session`, { withCredentials: true }).pipe(
            tap(user => this.#user.set(user)), // Guardamos el usuario en el Signal
            map(() => true),                   // <--- Transformamos el flujo a boolean (ÉXITO)
            catchError((err) => {
                this.#user.set(null);
                return of(false);                // <--- En caso de error, devolvemos false
            })
        );
    }

    login(credentials: any): Observable<User> {
        return this.http.post<User>(`${this.API_URL}/login`, credentials, { withCredentials: true }).pipe(
            tap(user => {
                this.#user.set(user);
                this.router.navigate(['/inventory']);
            })
        );
    }

    logout() {
        // RETORNA el observable, no te suscribas aquí
        return this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).pipe(
            tap({
                next: () => {
                    this.#user.set(null);
                    this.currentUser.set(null);
                },
                error: () => {
                    this.#user.set(null);
                    this.currentUser.set(null);
                }
            })
        );
    }
}