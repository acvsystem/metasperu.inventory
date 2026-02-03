import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, ScanEntry } from '../../core/db/offline-db'; // La DB que definimos antes
import { firstValueFrom, Observable } from 'rxjs';
import { InventoryService } from '@metasperu/services/inventory.service';

@Injectable({ providedIn: 'root' })
export class PocketInventoryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.metasperu.net.pe/s3/inventory';
  private readonly API_URL = 'https://api.metasperu.net.pe/s3/inventory';
  private invService = inject(InventoryService);

  // Guardar escaneo en LocalStorage (IndexedDB)
  async saveScanLocally(seccion_id: number, sessionCode: string, sku: string, quantity: number) {
    const newScan: ScanEntry = {
      sku,
      quantity: quantity,
      session_code: sessionCode,
      scanned_at: new Date(),
      synced: 0, // Estado: Pendiente
      seccion_id: seccion_id
    };
    return await db.scans.add(newScan);
  }

  // Enviar todo lo pendiente al Backend
  async syncWithBackend(sessionCode: string) {
    const pending = await db.scans
      .where({ session_code: sessionCode, synced: 0 })
      .toArray();

    if (pending.length === 0) return;

    try {
      // Enviamos el bulk al backend (la cookie de auth se envía sola por withCredentials)
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/sync-bulk`, {
          session_code: sessionCode,
          scans: pending
        })
      );

      // Si el servidor responde OK, marcamos como sincronizados localmente
      const ids = pending.map((p: ScanEntry) => p.id!);
      await db.scans.bulkUpdate(ids.map((id: any) => ({ key: id, changes: { synced: 1 } })));

      // Opcional: Borrar los ya sincronizados para no llenar el dispositivo
      // await db.scans.bulkDelete(ids); 

      return true;
    } catch (err: any) {
      this.onNotification({ error: 'error', message: err?.error.error });
      console.error('Error de sincronización, se reintentará luego', err?.error.error);
      return false;
    }
  }

  async syncIndexedBD(sessionCode: string) {
    const dataScanPocket = await db.scans
      .where({ session_code: sessionCode, synced: 0 })
      .toArray();

    return dataScanPocket || [];
  }


  getPocketScan(sessionCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/pocket/scan/${sessionCode}`);
  }

  private onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length ? true : false,
      isError: result?.error?.length ? true : false,
      bodyNotification: result?.message
    }];

    this.invService.onNotification.emit(notificationList);
  }
}