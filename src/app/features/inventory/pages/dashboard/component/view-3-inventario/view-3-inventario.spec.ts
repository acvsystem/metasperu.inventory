import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
import { MtDatatable } from '@metasperu/component/mt-datatable/mt-datatable';
import * as XLSX from 'xlsx';
import { InventoryService } from '@metasperu/services/inventory.service';
import { View3Inventario } from './view-3-inventario';

describe('Productos sin exhibir: paginación y exportación completas', () => {
  const products = Array.from({ length: 183 }, (_, i) => ({ id: i + 1, cCodigoBarra: String(i + 1), cDescripcion: `Producto ${i + 1}` }));
  async function setup(failSecondPage = false) {
    const api = jasmine.createSpy().and.callFake(({ page }: { page: number }) => {
      if (failSecondPage && page === 2) return throwError(() => Error('offline'));
      return of({ products: products.slice((page - 1) * 50, page * 50), pagination: { page, pageSize: 50, totalRows: 183, totalPages: 4 } });
    });
    await TestBed.configureTestingModule({ imports: [View3Inventario], providers: [{ provide: InventoryService, useValue: { getProductsWithoutDisplay: api } }] }).compileComponents();
    const fixture = TestBed.createComponent(View3Inventario);
    fixture.componentInstance.sessionCode = 'ABC123';
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, view: fixture.componentInstance, api };
  }

  it('keeps exactly the table paginator with all 183 items and exports all workbook rows', async () => {
    const { fixture, view, api } = await setup();
    await view.loadProductsWithoutDisplay();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(view.dataProcess.length).toBe(183);
    expect(api.calls.count()).toBe(4);
    expect(fixture.nativeElement.querySelectorAll('mat-paginator').length).toBe(1);
    expect(fixture.nativeElement.querySelector('.mat-mdc-paginator-range-label').textContent).toContain('183');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(10);
    expect(fixture.nativeElement.querySelector('.record-count').textContent).toContain('183');
    const paginator = fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
    paginator.lastPage();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Producto 183');
    const save = spyOn<any>(view, 'saveAsExcelFile');
    view.exportarExcel();
    const book = XLSX.read(save.calls.mostRecent().args[0], { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<any>(book.Sheets['Inventario']);
    expect(rows.length).toBe(183);
    expect(rows[182].cCodigoBarra).toBe('183');
  });

  it('filters the complete result and exports matching products beyond the first API page', async () => {
    const { fixture, view } = await setup();
    await view.loadProductsWithoutDisplay();
    fixture.detectChanges();
    await fixture.whenStable();
    const table = fixture.debugElement.query(By.directive(MtDatatable)).componentInstance as MtDatatable;
    table.applyFilterTable({ target: { value: 'Producto 18' } }, 'descripcion');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.record-count').textContent).toContain('5');
    const save = spyOn<any>(view, 'saveAsExcelFile');
    view.exportarExcel();
    const book = XLSX.read(save.calls.mostRecent().args[0], { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<any>(book.Sheets['Inventario']);
    expect(rows.map(row => row.cCodigoBarra)).toEqual(['18', '180', '181', '182', '183']);
  });

  it('does not expose a partial result as exportable when a later API page fails', async () => {
    spyOn(console, 'error');
    const { fixture, view } = await setup(true);
    await view.loadProductsWithoutDisplay();
    fixture.detectChanges();
    expect(view.dataProcess.length).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    const save = spyOn<any>(view, 'saveAsExcelFile');
    view.exportarExcel();
    expect(save).not.toHaveBeenCalled();
  });
});
