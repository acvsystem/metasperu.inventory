import Dexie, { Table } from 'dexie';

export interface ScanEntry {
  id?: number;
  sku: string;
  quantity: number;
  session_code: string;
  scanned_at: Date;
  synced: number; 
}

export class OfflineDB extends Dexie {
  scans!: Table<ScanEntry>;

  constructor() {
    super('MetasPeruDB');
    this.version(1).stores({
      scans: '++id, session_code, synced, sku'
    });
  }
}

// ESTA LÍNEA ES VITAL
export const db = new OfflineDB();