import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import InventorySession from './inventory-session';

describe('Inventory session search', () => {
  const rows = [
    { codigo_sesion: 'ABC123', nombre_tienda: 'Miraflores', estado: 'ACTIVO' },
    { codigo_sesion: 'DEF456', nombre_tienda: 'San Miguel', estado: 'FINALIZADO' },
  ];
  let page: InventorySession;
  beforeEach(() => {
    page = Object.create(InventorySession.prototype);
    Object.assign(page, {
      dataSource: new MatTableDataSource(rows),
      sessions: [],
      stores: [],
      arSections: [],
      filterValues: {},
      inFilter: '',
      dataColumns: [{ matColumnDef: 'estado', propertyValue: 'estado', filterActive: false }],
      inventoryService: {
        getSubzonas: () => of([]),
        getStores: () => of([]),
        getSessions: () => of(rows),
      },
    });
    page.ngOnInit();
  });
  it('searches by store name and restores the list when cleared', () => {
    page.applyFilter({ value: 'miraflores' });
    expect(page.dataSource.filteredData.map((row) => row.codigo_sesion)).toEqual(['ABC123']);
    page.applyFilter({ value: '' });
    expect(page.dataSource.filteredData.length).toBe(2);
  });
  it('combines the general search with a column filter', () => {
    page.applyFilterTable({ target: { value: 'FINALIZADO' } } as unknown as Event, 'estado');
    page.applyFilter({ value: 'San Miguel' });
    expect(page.dataSource.filteredData.map((row) => row.codigo_sesion)).toEqual(['DEF456']);
    page.applyFilter({ value: 'Miraflores' });
    expect(page.dataSource.filteredData.length).toBe(0);
  });
});
