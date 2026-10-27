import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import Dashboard from './dashboard';

describe('stock API pagination', () => {
  let page: any;
  let responses: Subject<any>[];
  beforeEach(() => {
    responses = [];
    page = Object.assign(Object.create(Dashboard.prototype), {
      sessionCode: 'ABC123',
      serieStore: '100',
      inventoryPage: 1,
      inventoryPageSize: 50,
      inventoryTotalRows: 120,
      inventoryRequestId: 0,
      inventoryFilterValues: {},
      isLoading2: signal(false),
      totalStock: signal(0),
      totalConteo: signal(0),
      totalDiferencia: signal(0),
      presentToast: jasmine.createSpy(),
      dataInventario: [{ id: 1 }],
      invService: {
        getStoreInventory: jasmine.createSpy().and.callFake(() => {
          const response = new Subject<any>();
          responses.push(response);
          return response;
        }),
      },
    });
  });
  const response = (id: number) => ({
    inventario: [{ id }],
    pagination: { totalRows: 120 },
    summary: { total_rows: 120, total_stock: 1200, total_conteo: 600, total_diferencia: -600 },
  });
  it('requests page two from API and keeps global count rather than using returned page length', () => {
    page.onInventoryPageChange({ pageIndex: 1, pageSize: 50 });
    expect(page.invService.getStoreInventory).toHaveBeenCalledWith({
      session_code: 'ABC123',
      serie_store: '100',
      page: 2,
      pageSize: 50,
    });
    responses[0].next(response(51));
    expect(page.inventoryPage).toBe(2);
    expect(page.inventoryTotalRows).toBe(120);
    expect(page.dataInventario[0].id).toBe(51);
  });
  it('restores page controls on a network error without labeling old rows as the next page', () => {
    page.loadInventaryPage(2, 50);
    responses[0].error(new Error('offline'));
    expect(page.inventoryPage).toBe(1);
    expect(page.dataInventario[0].id).toBe(1);
    expect(page.isLoading2()).toBeFalse();
    expect(page.presentToast).toHaveBeenCalled();
  });
  it('ignores slow responses from a previous page request', () => {
    page.loadInventaryPage(2, 50);
    page.loadInventaryPage(3, 50);
    responses[1].next(response(101));
    responses[0].next(response(51));
    expect(page.inventoryPage).toBe(3);
    expect(page.dataInventario[0].id).toBe(101);
  });
  it('loads the first real page after importing instead of clearing the table with a summary-only request', fakeAsync(() => {
    page.invService.impInventarioSession = () => of({ insertedRows: 120 });
    page.onNotification = jasmine.createSpy();
    const load = spyOn(page, 'loadInventaryPage');
    page.enviarInventarioAApi([]);
    flushMicrotasks();
    tick(1000);
    expect(load).toHaveBeenCalledWith(1, 50);
  }));
});
