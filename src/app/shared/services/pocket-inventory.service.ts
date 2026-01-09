import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, ScanEntry } from '../../core/db/offline-db'; // La DB que definimos antes
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PocketInventoryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.metasperu.net.pe/s3/inventory';

  // Guardar escaneo en LocalStorage (IndexedDB)
  async saveScanLocally(sessionCode: string, sku: string) {
    const newScan: ScanEntry = {
      sku,
      quantity: 1,
      session_code: sessionCode,
      scanned_at: new Date(),
      synced: 0 // Estado: Pendiente
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
      await db.scans.bulkUpdate(ids.map((id:any) => ({ key: id, changes: { synced: 1 } })));
      
      // Opcional: Borrar los ya sincronizados para no llenar el dispositivo
      // await db.scans.bulkDelete(ids); 
      
      return true;
    } catch (error) {
      console.error('Error de sincronización, se reintentará luego', error);
      return false;
    }
  }
}