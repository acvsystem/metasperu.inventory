import { EventEmitter, Injectable, Output, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

// Definición de interfaces para mejores sugerencias de código (IntelliSense)
export interface storeData {
    id?: number;
    serie: string;
    nombre_tienda: string;
}

@Injectable({
    providedIn: 'root'
})
export class StoreService {

    private http = inject(HttpClient);

    // Cambia esta URL según tu entorno de desarrollo/producción
    private readonly API_URL = 'https://api.metasperu.net.pe/s3/inventory';

    getStore(): Observable<any[]> {
        return this.http.get<any[]>(`${this.API_URL}/api/v1/store`);
    }

    postStore(data: storeData): Observable<any> {
        return this.http.post(
            `${this.API_URL}/api/v1/store`, data
        ).pipe(
            catchError(this.handleError)
        );
    }

    putStore(data: storeData): Observable<any> {
        return this.http.put(
            `${this.API_URL}/api/v1/store`, data
        ).pipe(
            catchError(this.handleError)
        );
    }

    delStore(store_id: number): Observable<any> {
        return this.http.delete(
            `${this.API_URL}/api/v1/store/${store_id}`
        ).pipe(
            catchError(this.handleError)
        );
    }

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


}