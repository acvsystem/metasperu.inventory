import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PocketInventoryService } from './pocket-inventory.service';
import { InventoryService } from './inventory.service';
import { db } from '../../core/db/offline-db';

describe('Pocket pending synchronization', () => {
  let service: PocketInventoryService;
  let http: HttpTestingController;
  let rows: any[];
  const endpoint = 'https://api.metasperu.net.pe/s3/inventory/sync-bulk';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: InventoryService, useValue: { onNotification: { emit: jasmine.createSpy() } } }
    ] });
    service = TestBed.inject(PocketInventoryService);
    http = TestBed.inject(HttpTestingController);
    rows = [{ id: 1, session_code: 'TEST', sku: '00123', quantity: 2, synced: 0 }];
    spyOn(db.scans, 'where').and.callFake(((filter: any) => ({
      toArray: async () => rows.filter(row => Object.keys(filter).every(key => row[key] === filter[key])).map(row => ({ ...row }))
    })) as any);
    spyOn(db.scans, 'bulkDelete').and.callFake(((ids: any[]) => {
      rows = rows.filter(row => !ids.includes(row.id));
      return Promise.resolve();
    }) as any);
  });

  afterEach(() => http.verify());

  it('removes only acknowledged records, retaining scans added during the upload', async () => {
    const result = service.syncWithBackend('TEST');
    await Promise.resolve();
    const request = http.expectOne(endpoint);
    expect(rows.length).toBe(1);
    rows.push({ id: 2, session_code: 'TEST', synced: 0 });
    request.flush({ message: 'Sincronizacion exitosa' });
    expect(await result).toBeTrue();
    expect(rows.map(row => row.id)).toEqual([2]);
  });

  it('keeps pending records after an unsuccessful upload and permits retry', async () => {
    const result = service.syncWithBackend('TEST');
    await Promise.resolve();
    http.expectOne(endpoint).flush({ error: 'Error' }, { status: 500, statusText: 'Error' });
    expect(await result).toBeFalse();
    expect(rows.length).toBe(1);
    const retry = service.syncWithBackend('TEST');
    await Promise.resolve();
    http.expectOne(endpoint).flush({});
    expect(await retry).toBeTrue();
  });

  it('prevents overlapping uploads and editing or deleting an in-flight record', async () => {
    const result = service.syncWithBackend('TEST');
    expect(await service.syncWithBackend('TEST')).toBeFalse();
    await expectAsync(service.updatePending(1, 'TEST', '999', 3)).toBeRejected();
    await expectAsync(service.deletePending(1, 'TEST')).toBeRejected();
    http.expectOne(endpoint).flush({});
    await result;
  });

  it('never uploads pending records from another session', async () => {
    expect(await service.syncWithBackend('OTHER')).toBeTrue();
    http.expectNone(endpoint);
    expect(rows.length).toBe(1);
  });
});
