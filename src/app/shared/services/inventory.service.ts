import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

// Definición de interfaces para mejores sugerencias de código (IntelliSense)
export interface ScanData {
    sku: string;
    quantity: number;
    scanned_at: string;
}

export interface SessionResponse {
    id: number;
    session_code: string;
    store_name: string;
    status: string;
}

export interface Store {
    id: number;
    serie: string;
    nombre_tienda: string;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private http = inject(HttpClient);

    // Cambia esta URL según tu entorno de desarrollo/producción
    private readonly API_URL = 'https://api.metasperu.net.pe/s3/inventory';

    // Estado reactivo de la sesión actual
    public activeSession = signal<SessionResponse | null>(null);

    /**
     * ADMIN: Crear una nueva sesión de inventario
     */
    createSession(storeName: number): Observable<SessionResponse> {
        return this.http.post<SessionResponse>(
            `${this.API_URL}/create-session`,
            { tienda_id: storeName }
        ).pipe(
            tap(session => this.activeSession.set(session)),
            catchError(this.handleError)
        );
    }

    /**
     * POCKET: Validar si un código de sesión existe y está activo
     */
    validateSession(sessionCode: string): Observable<SessionResponse> {
        return this.http.get<SessionResponse>(
            `${this.API_URL}/validate-session/${sessionCode}`
        ).pipe(
            tap(session => this.activeSession.set(session)),
            catchError(this.handleError)
        );
    }

    /**
     * POCKET: Sincronización masiva de escaneos (Offline -> Online)
     */
    syncBulkScans(sessionCode: string, scans: ScanData[]): Observable<any> {
        return this.http.post(
            `${this.API_URL}/sync-bulk`,
            {
                session_code: sessionCode,
                scans: scans
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * ADMIN: Obtener el resumen acumulado de la sesión (para el Dashboard)
     */
    getSessionSummary(sessionCode: string): Observable<any> {
        return this.http.get(
            `${this.API_URL}/summary/${sessionCode}`
        ).pipe(
            catchError(this.handleError)
        );
    }

    getSessions(): Observable<any> {
        return this.http.get(
            `${this.API_URL}/sessions`
        ).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Manejo centralizado de errores de HTTP
     */
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Ocurrió un error desconocido';

        if (error.status === 401) {
            errorMessage = 'Sesión expirada o no autorizada. Por favor, inicie sesión.';
        } else if (error.status === 404) {
            errorMessage = 'El código de inventario no existe.';
        } else if (error.error?.message) {
            errorMessage = error.error.message;
        }

        console.error(`Error ${error.status}:`, error);
        return throwError(() => new Error(errorMessage));
    }

    // Dentro de la clase InventoryService
    getStores(): Observable<Store[]> {
        return this.http.get<Store[]>(`${this.API_URL}/stores`);
    }

    getActiveSessions(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/active-sessions`);
    }

    getStoreInventory(params: any): Observable<Store[]> {
        // Convertimos el objeto en parámetros de URL automáticamente
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        // La URL quedará como: .../request/store?sessionCode=XXX&tiendaId=YYY
        return this.http.get<Store[]>(`${this.API_URL}/request/store`, { params: httpParams });
    }

}