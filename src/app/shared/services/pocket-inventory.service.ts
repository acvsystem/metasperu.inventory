import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db, ScanEntry } from '../../core/db/offline-db'; // La DB que definimos antes
import { firstValueFrom, Observable, BehaviorSubject, timeout } from 'rxjs';
import { InventoryService } from '@metasperu/services/inventory.service';

export interface PocketSyncStatus {
  sessionCode: string;
  phase: 'idle' | 'sending' | 'success' | 'error';
  confirmed: number;
  total: number;
  message: string;
  lastSuccess: string | null;
}

function scanId(): string {
  const bytes = new Uint8Array(16);
  const webCrypto = globalThis.crypto;
  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

@Injectable({ providedIn: 'root' })
export class PocketInventoryService {
  readonly syncStatus = new BehaviorSubject<PocketSyncStatus>({ sessionCode: '', phase: 'idle', confirmed: 0, total: 0, message: '', lastSuccess: null });
  readonly operationMode = new BehaviorSubject<'online' | 'manual'>(localStorage.getItem('pocketOperationMode') === 'manual' ? 'manual' : 'online');
  modeChangeAllowed = () => true;

  setOperationMode(mode: 'online' | 'manual') {
    if (!this.modeChangeAllowed() || mode === this.operationMode.value) return;
    localStorage.setItem('pocketOperationMode', mode);
    this.operationMode.next(mode);
  }
  private http = inject(HttpClient);
  private apiUrl = 'https://api.metasperu.net.pe/s3/inventory';
  private readonly API_URL = 'https://api.metasperu.net.pe/s3/inventory';
  private invService = inject(InventoryService);
  private syncing = new Set<string>();

  async updatePending(id: number, sessionCode: string, sku: string, quantity: number) {
    if (this.syncing.has(sessionCode)) throw new Error('Sincronizacion en curso');
    await db.transaction('rw', db.scans, async () => {
      const scan = await db.scans.get(id);
      if (!scan || scan.synced || scan.upload_attempted || scan.session_code !== sessionCode) throw new Error('Confirme el envio antes de modificar este registro');
      await db.scans.update(id, { sku, quantity });
    });
  }

  async deletePending(id: number, sessionCode: string) {
    if (this.syncing.has(sessionCode)) throw new Error('Sincronizacion en curso');
    await db.transaction('rw', db.scans, async () => {
      const scan = await db.scans.get(id);
      if (!scan || scan.synced || scan.upload_attempted || scan.session_code !== sessionCode) throw new Error('Confirme el envio antes de eliminar este registro');
      await db.scans.delete(id);
    });
  }

  // Guardar escaneo en LocalStorage (IndexedDB)
  async saveScanLocally(seccion_id: number, sessionCode: string, sku: string, quantity: number) {
    const newScan: ScanEntry = {
      client_scan_id: scanId(),
      sku,
      quantity: quantity,
      session_code: sessionCode,
      scanned_at: new Date(),
      synced: 0, // Estado: Pendiente
      seccion_id: seccion_id
    };
    return await db.scans.add(newScan);
  }

  async getHistoryScans(sessionCode: string): Promise<ScanEntry[]> {
    return await db.scans.where({ session_code: sessionCode }).toArray();
  }
  // Enviar todo lo pendiente al Backend
  async syncWithBackend(sessionCode: string) {
    if (this.syncing.has(sessionCode)) return false;
    this.syncing.add(sessionCode);
    const status: PocketSyncStatus = {
      sessionCode, phase: 'sending', confirmed: 0, total: 0,
      message: 'Preparando envio...', lastSuccess: localStorage.getItem('pocketLastSync:' + sessionCode)
    };
    const publish = () => this.syncStatus.next({ ...status });
    publish();
    try {
      const pendingQuery = () => db.scans.where({ session_code: sessionCode, synced: 0 });
      const last = await pendingQuery().last();
      const ceiling = last?.id || 0;
      status.total = await pendingQuery().and(s => s.id! <= ceiling).count();
      while (true) {
        // Freeze the payload before any network request, including old offline records.
        const batch = await db.transaction('rw', db.scans, async () => {
          const rows = await pendingQuery().and(s => s.id! <= ceiling).limit(200).toArray();
          for (const row of rows) {
            row.client_scan_id ||= scanId();
            row.upload_attempted = true;
            await db.scans.update(row.id!, { client_scan_id: row.client_scan_id, upload_attempted: true });
          }
          return rows;
        });
        if (!batch.length) break;
        status.message = `Enviando: ${status.confirmed} de ${status.total} confirmados`;
        publish();
        const response = await firstValueFrom(this.http.post<{ acknowledged: string[] }>(`${this.apiUrl}/sync-bulk`, {
          session_code: sessionCode, scans: batch
        }).pipe(timeout(45000)));
        if (!Array.isArray(response?.acknowledged)) throw new Error('El servidor no confirmo los identificadores. Actualice el backend.');
        const confirmed = new Set(response.acknowledged);
        const accepted = batch.filter(row => confirmed.has(row.client_scan_id!));
        await db.scans.bulkDelete(accepted.map(row => row.id!));
        status.confirmed += accepted.length;
        publish();
        if (accepted.length !== batch.length) throw new Error('Confirmacion incompleta. Reintente los registros pendientes.');
      }
      status.phase = 'success';
      status.message = status.confirmed ? `${status.confirmed} escaneos sincronizados con exito` : 'No hay escaneos pendientes';
      if (status.confirmed) {
        status.lastSuccess = new Date().toISOString();
        localStorage.setItem('pocketLastSync:' + sessionCode, status.lastSuccess);
      }
      publish();
      return true;
    } catch (error: any) {
      status.phase = 'error';
      status.message = error?.error?.error || error?.message || 'No se pudo confirmar el envio. Reintente la sincronizacion.';
      publish();
      this.onNotification({ error: 'error', message: status.message });
      return false;
    } finally {
      this.syncing.delete(sessionCode);
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

  getHistoryPage(sessionCode: string, page: number, pageSize: number, search: string) {
    return this.http.get<{ items: ScanEntry[]; total: number }>(`${this.API_URL}/pocket/scan/${encodeURIComponent(sessionCode)}`, {
      params: { page, pageSize, search }
    });
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
