import { EventEmitter, Injectable, Output, inject, signal } from '@angular/core';
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

export interface pocketScan {
    id: number;
    cantidad: number;
}

export interface PocketPerformanceResponse {
    users: any[];
    sections: any[];
    selectedUserId: number | null;
    inactivitySeconds: number;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    @Output() onNotification: EventEmitter<any> = new EventEmitter();
    @Output() onMenu: EventEmitter<any> = new EventEmitter();
    @Output() onInventoryArea: EventEmitter<any> = new EventEmitter();
    private http = inject(HttpClient);

    // Cambia esta URL según tu entorno de desarrollo/producción
    private readonly API_URL = 'https://api.metasperu.net.pe/s3/inventory';

    // Estado reactivo de la sesión actual
    public activeSession = signal<SessionResponse | null>(null);

    /**
     * ADMIN: Crear una nueva sesión de inventario
     */
    createSession(storeName: number, sections: Array<any>): Observable<SessionResponse> {
        return this.http.post<SessionResponse>(
            `${this.API_URL}/create-session`,
            { tienda_id: storeName, assigned_section: sections }
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

    getSessionSummaryv2(sessionCode: string, params?: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        return this.http.get(
            `${this.API_URL}/v2/summary/${sessionCode}`,
            { params: httpParams }
        ).pipe(
            catchError(this.handleError)
        );
    }

    exportSessionSummaryCsv(sessionCode: string, params?: any): Observable<Blob> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        return this.http.get(`${this.API_URL}/v2/summary/${sessionCode}/export/csv`, {
            params: httpParams,
            responseType: 'blob'
        });
    }

    getSessionStatistics(sessionCode: string): Observable<any> {
        return this.http.get(
            `${this.API_URL}/v2/summary/${sessionCode}/statistics`
        ).pipe(
            catchError(this.handleError)
        );
    }

    getPocketPerformance(sessionCode: string, userId?: number | null): Observable<PocketPerformanceResponse> {
        let httpParams = new HttpParams();

        if (userId !== null && userId !== undefined) {
            httpParams = httpParams.set('userId', userId);
        }

        return this.http.get<PocketPerformanceResponse>(
            `${this.API_URL}/pocket/performance/${sessionCode}`,
            { params: httpParams }
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
        const self = this;
        let errorMessage = 'Ocurrió un error desconocido';

        if (error.status === 401) {
            errorMessage = 'Sesión expirada o no autorizada. Por favor, inicie sesión.';
        } else if (error.status === 404) {
            errorMessage = 'El código de inventario no existe.';
        } else if (error.error?.message) {
            errorMessage = error.error.message;
        }

        //console.error(`Error ${error.status}:`, error);

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
                    if (Array.isArray(params[key])) {
                        params[key].forEach((value: any) => {
                            if (value !== null && value !== undefined && value !== '') {
                                httpParams = httpParams.append(key, value);
                            }
                        });
                    } else {
                        httpParams = httpParams.append(key, params[key]);
                    }
                }
            });
        }

        // La URL quedará como: .../request/store?sessionCode=XXX&tiendaId=YYY
        return this.http.get<Store[]>(`${this.API_URL}/request/store`, { params: httpParams });
    }

    exportStoreInventoryCsv(params: any): Observable<Blob> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    if (Array.isArray(params[key])) {
                        params[key].forEach((value: any) => {
                            if (value !== null && value !== undefined && value !== '') {
                                httpParams = httpParams.append(key, value);
                            }
                        });
                    } else {
                        httpParams = httpParams.append(key, params[key]);
                    }
                }
            });
        }

        return this.http.get(`${this.API_URL}/request/store/export/csv`, {
            params: httpParams,
            responseType: 'blob'
        });
    }

    getStoreStatistics(params: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        return this.http.get(`${this.API_URL}/request/store/statistics`, {
            params: httpParams
        }).pipe(
            catchError(this.handleError)
        );
    }

    getProductsWithoutDisplay(params: any): Observable<any> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        return this.http.get(`${this.API_URL}/request/store/products-without-display`, {
            params: httpParams
        }).pipe(
            catchError(this.handleError)
        );
    }

    getSubzonas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/api/v1/seccion`);
    }

    getZonaVista(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/api/v2/zonas/subzonas`);
    }

    getZonas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/api/v2/zonas`);
    }

    postZonas(nombreZona: string): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v2/zonas`,
            {
                nombre_zona: nombreZona,
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    putZonas(zona_id: number, nombreZona: string): Observable<any> {
        return this.http.put(
            `${this.API_URL}/api/v2/zonas`,
            {
                zona_id,
                nombre_zona: nombreZona,
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    postSections(nombreSection: string): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v1/seccion`,
            {
                nombre_seccion: nombreSection,
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    postSectionsBulk(data: any): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v1/seccion/bulk`,
            data
        ).pipe(
            catchError(this.handleError)
        );
    }

    assignSectionsToSessionBulk(data: any): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v1/seccion/session/bulk`,
            data
        ).pipe(
            catchError(this.handleError)
        );
    }

    postSectionSession(session_code: string, seccion_id: number): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v1/seccion/count/session`,
            {
                session_code: session_code,
                seccion_id: seccion_id
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    putSections(seccion_id: number, nombreSection: string): Observable<any> {
        return this.http.put(
            `${this.API_URL}/api/v1/seccion`,
            {
                seccion_id: seccion_id,
                nombre_seccion: nombreSection,
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    delSections(seccion_id: number): Observable<any> {
        return this.http.delete(
            `${this.API_URL}/api/v1/seccion/${seccion_id}`
        ).pipe(
            catchError(this.handleError)
        );
    }


    getAssignedSections(sessionCode: string): Observable<any> {
        return this.http.get(
            `${this.API_URL}/section/assigned/${sessionCode}`
        ).pipe(
            catchError(this.handleError)
        );
    }

    putEndedSession(codeSession: string): Observable<any> {
        return this.http.put(
            `${this.API_URL}/ended-session`,
            {
                codeSession: codeSession
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    putStartSession(codeSession: string): Observable<any> {
        return this.http.put(
            `${this.API_URL}/estart-session`,
            {
                codeSession: codeSession
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    putPocketScan(data: pocketScan): Observable<any> {
        return this.http.put(
            `${this.API_URL}/pocket/scan`, data
        ).pipe(
            catchError(this.handleError)
        );
    }

    putCheckedInventario(data: any): Observable<any> {
        console.log(data);
        return this.http.put(
            `${this.API_URL}/checked/row/inv`, data
        ).pipe(
            catchError(this.handleError)
        );
    }

    putZonaSubzona(zona_escaneo_id: number, zona_id: number, seccion_id: number): Observable<any> {
        return this.http.put(
            `${this.API_URL}/api/v2/zonas/subzonas`,
            {
                zona_escaneo_id: zona_escaneo_id,
                zona_id: zona_id,
                seccion_id: seccion_id
            }
        ).pipe(
            catchError(this.handleError)
        );
    }


    delZonas(zona_id: number): Observable<any> {
        return this.http.delete(
            `${this.API_URL}/api/v2/zona/${zona_id}`
        ).pipe(
            catchError(this.handleError)
        );
    }

    delSectionConteo(session_code: string, seccion_id: number): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/delete/zona/escaneo`,
            {
                session_code: session_code,
                seccion_id: seccion_id
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    impInventarioSession(sessionCode: string, items: any[]): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/import/store/sesion`,   // ← Cambia esta ruta por la real de tu backend
            {
                sessionCode: sessionCode,
                items: items
            }
        ).pipe(
            catchError(this.handleError)
        );
    }

    impConteoSession(sessionCode: string, items: any[]): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/import/conteo/sesion`,   // ← Cambia esta ruta por la real de tu backend
            {
                session_code: sessionCode,
                items: items
            }
        ).pipe(
            catchError(this.handleError)
        );
    }
}
