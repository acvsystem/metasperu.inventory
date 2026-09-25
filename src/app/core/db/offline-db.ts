import Dexie, { Table } from 'dexie';

export interface ScanEntry {
  id?: number;
  client_scan_id?: string;
  upload_attempted?: boolean;
  sku: string;
  quantity: number;
  session_code: string;
  scanned_at: Date;
  synced: number;
  seccion_id: number;
}

export class OfflineDB extends Dexie {
  scans!: Table<ScanEntry>;

  constructor() {
    super('MetasPeruDB');
    this.version(1).stores({
      scans: '++id, session_code, synced, sku, seccion_id'
    });
    this.version(2).stores({
      scans: '++id, session_code, synced, sku, seccion_id, [session_code+synced]'
    });
  }
}

// ESTA LÍNEA ES VITAL
export const db = new OfflineDB();
