import { serviceConfig } from '../../core/config/service-config';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { PocketInventoryService } from './pocket-inventory.service';
import { InventoryService } from './inventory.service';
import { db } from '../../core/db/offline-db';

describe('Pocket pending synchronization', () => {
  let service: PocketInventoryService;
  let http: HttpTestingController;
  const endpoint = serviceConfig.inventoryApiUrl + '/sync-bulk';
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: InventoryService, useValue: { onNotification: { emit: jasmine.createSpy() } } },
      ],
    });
    service = TestBed.inject(PocketInventoryService);
    http = TestBed.inject(HttpTestingController);
    await db.scans.clear();
    await service.saveScanLocally(1, 'TEST', '00123', 2);
  });
  afterEach(async () => {
    http.verify();
    await db.scans.clear();
    localStorage.removeItem('pocketLastSync:TEST');
  });
  async function request(): Promise<TestRequest> {
    for (let attempt = 0; attempt < 200; attempt++) {
      const matches = http.match(endpoint);
      if (matches.length) {
        expect(matches.length).toBe(1);
        return matches[0];
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    throw Error('No upload request after IndexedDB transaction');
  }

  it('checks update readiness without removing or uploading any pending counts', async () => {
    const before = await db.scans.toArray();
    expect(await service.prepareForAppUpdate()).toBe(1);
    expect(await db.scans.toArray()).toEqual(before);
    http.expectNone(endpoint);
  });

  it('blocks an update while a local write is in progress', async () => {
    const saving = service.saveScanLocally(1, 'TEST', 'PRESERVED', 3);
    await expectAsync(service.prepareForAppUpdate()).toBeRejectedWithError(/guardado/);
    await saving;
    expect(await service.prepareForAppUpdate()).toBe(2);
  });

  it('blocks an update during an upload and preserves unacknowledged counts', async () => {
    const sending = service.syncWithBackend('TEST');
    const req = await request();
    await expectAsync(service.prepareForAppUpdate()).toBeRejectedWithError(/envío/);
    req.flush({}, { status: 500, statusText: 'Error' });
    await sending;
    expect(await service.prepareForAppUpdate()).toBe(1);
    expect((await db.scans.toArray())[0].sku).toBe('00123');
  });
  function acknowledge(req: TestRequest) {
    req.flush({ acknowledged: req.request.body.scans.map((scan: any) => scan.client_scan_id) });
  }
  it('removes acknowledged records while retaining scans added during upload', async () => {
    const result = service.syncWithBackend('TEST');
    const req = await request();
    await service.saveScanLocally(1, 'TEST', 'NEW', 1);
    acknowledge(req);
    expect(await result).toBeTrue();
    expect((await db.scans.toArray()).map((row) => row.sku)).toEqual(['NEW']);
  });
  it('retains failed uploads and retries the same client identifiers', async () => {
    const result = service.syncWithBackend('TEST');
    const req = await request();
    const id = req.request.body.scans[0].client_scan_id;
    req.flush({ error: 'Error' }, { status: 500, statusText: 'Error' });
    expect(await result).toBeFalse();
    expect(await db.scans.count()).toBe(1);
    const retry = service.syncWithBackend('TEST');
    const again = await request();
    expect(again.request.body.scans[0].client_scan_id).toBe(id);
    acknowledge(again);
    expect(await retry).toBeTrue();
    expect(await db.scans.count()).toBe(0);
  });
  it('prevents overlapping uploads and changes to in-flight records', async () => {
    const id = (await db.scans.toArray())[0].id!;
    const result = service.syncWithBackend('TEST');
    expect(await service.syncWithBackend('TEST')).toBeFalse();
    await expectAsync(service.updatePending(id, 'TEST', '999', 3)).toBeRejected();
    await expectAsync(service.deletePending(id, 'TEST')).toBeRejected();
    acknowledge(await request());
    expect(await result).toBeTrue();
  });
  it('never uploads records from another session', async () => {
    expect(await service.syncWithBackend('OTHER')).toBeTrue();
    http.expectNone(endpoint);
    expect(await db.scans.count()).toBe(1);
  });
  it('keeps unacknowledged records after a partial confirmation', async () => {
    await service.saveScanLocally(1, 'TEST', 'SECOND', 1);
    const result = service.syncWithBackend('TEST');
    const req = await request();
    req.flush({ acknowledged: [req.request.body.scans[0].client_scan_id] });
    expect(await result).toBeFalse();
    expect((await db.scans.toArray()).map((row) => row.sku)).toEqual(['SECOND']);
  });
});
