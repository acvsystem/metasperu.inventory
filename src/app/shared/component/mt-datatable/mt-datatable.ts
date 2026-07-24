import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, AfterViewInit, OnChanges, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { MatMenu } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSort } from '@angular/material/sort';

export interface columnsTable {
  isSticky: boolean;
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive: boolean;
  isCboFilter: boolean;
  cboFilter: Array<any>;
}

const toNumber = (value: any) => {
  const numericValue = typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const numberValue = Number(numericValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const matchesTotalConteoFilter = (data: any, option: string) => {
  const totalConteo = toNumber(data['cTotalConteo']);
  const conteo = toNumber(data['cConteo']);

  if (option === 'positivo') return totalConteo > 0;
  if (option === 'negativo') return totalConteo < 0;
  if (option === 'cero sin escaneo') return totalConteo === 0 && conteo === 0;
  if (option === 'cero con escaneo' || option === 'cero escaneo') {
    return totalConteo === 0 && conteo > 0;
  }

  return false;
};

@Component({
  selector: 'mt-datatable',
  standalone: true,
  imports: [MatPaginatorModule, MatMenu, MtInput, MtSelect, MatMenuModule, MatTableModule, MatCheckboxModule],
  templateUrl: './mt-datatable.html',
  styleUrl: './mt-datatable.scss',
})
export class MtDatatable implements OnInit, OnChanges, AfterViewInit {
  // OPTIMIZACIÓN CRÍTICA: Interceptamos la entrada de datos con un setter
  // Esto asegura que la data se asigne al dataSource e inmediatamente se limite por el paginador
  private _dataIn: Array<any> = [];
  @Input() set dataIn(value: Array<any>) {
    this._dataIn = value || [];
    this.dataSource.data = this._dataIn;
    this.parsedFilterColumns.clear();
    this.resetCboFilters();
    
    // Si el paginador ya está listo en la vista, se lo re-asociamos de inmediato
    // Esto evita que Angular intente dibujar las 10,000 filas completas antes del AfterViewInit
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
  get dataIn(): Array<any> {
    return this._dataIn;
  }

  @Input() isChecking: Boolean = false;
  @Input() dataColumnsIn: columnsTable[] = [];
  @Input() extraColumns: Array<string> = [];
  @Output() currentDataFilter: EventEmitter<any> = new EventEmitter();

  dataSource = new MatTableDataSource<any>([]);
  filterValues: any = {};
  displayedColumns: Array<string> = [];
  datosFiltradosActuales: any[] = [];
  dataColumns: Array<any> = [];
  inFilter: string = "";
  private parsedFilterColumns = new Set<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private invService: InventoryService) {
    console.log("DATA TABLE INITIALIZED");
  }

  ngAfterViewInit() {
    // Vinculación física con el DOM para paginación y ordenamiento
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    // Nota: El manejo de 'dataIn' ahora corre por cuenta del setter reactivo @Input() set dataIn

    if (changes['dataColumnsIn'] && changes['dataColumnsIn'].currentValue) {
      this.dataColumns = changes['dataColumnsIn'].currentValue;
      this.parsedFilterColumns.clear();
    }

    if (changes['extraColumns'] && changes['extraColumns'].currentValue) {
      // Asignación limpia de las estructuras de columnas (incluyendo las 524 de Metas Perú)
      this.displayedColumns = changes['extraColumns'].currentValue;
    }
  }

  ngOnInit() {
    this.dataSource.data = this.dataIn;
    this.dataColumns = this.dataColumnsIn;

    // Predicado de filtrado optimizado para búsquedas por múltiples términos en memoria extendida
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      try {
        const searchTerms = JSON.parse(filter);

        return Object.keys(searchTerms).every(columnKey => {
          const searchTerm = searchTerms[columnKey];

          // 1. Si el filtro está vacío o no tiene longitud, pasa la validación de fila
          if (searchTerm === undefined || searchTerm === null || searchTerm === '' || (Array.isArray(searchTerm) && searchTerm.length === 0)) {
            return true;
          }

          // 2. Lógica especializada de rendimiento para 'cTotalConteo'
          if (columnKey === 'cTotalConteo') {
            const filtrosActivos = Array.isArray(searchTerm)
              ? searchTerm.map(s => s.toString().toLowerCase())
              : [searchTerm.toString().toLowerCase()];

            return filtrosActivos.some(opcion => matchesTotalConteoFilter(data, opcion));
          }

          // 3. Evaluación estándar de strings para el resto de columnas de stock
          const cellValue = data[columnKey]?.toString().toLowerCase() || '';

          if (Array.isArray(searchTerm)) {
            return searchTerm.map(s => s.toString().toLowerCase()).includes(cellValue);
          } else {
            return cellValue.includes(searchTerm.toString().toLowerCase());
          }
        });
      } catch (e) {
        // En caso de que falle el parseo del JSON del filtro, dejamos pasar la fila por seguridad
        return true;
      }
    };
  }

  async onChangeSelect(data: any, column: string) {
    const selectData = data?.map((item: any) => item.key);
    this.applyFilterTable('', column, selectData);
  }

  applyFilterTable(event: any, column: string, cboValue?: string) {
    const filterValue = cboValue?.length ? cboValue : (event.target as HTMLInputElement).value;
    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);
    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;
    this.filterValues[property?.propertyValue] = (cboValue || "").length ? cboValue : filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.datosFiltradosActuales = this.dataSource.filteredData;
    this.currentDataFilter.emit(this.datosFiltradosActuales);
  }


  applyFilter(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.inFilter = value ?? "";
    const filterValue = value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ensureCboFilter(column: any) {
    if (!column?.isCboFilter || this.parsedFilterColumns.has(column.matColumnDef)) return;

    const indexColumn = this.dataColumns.findIndex((dc) => dc.matColumnDef === column.matColumnDef);
    if (indexColumn === -1) return;

    const cboFilter = [...new Set(this.dataIn.map(item => item[column.propertyValue]))]
      .sort()
      .map(cbo => ({
        key: (cbo || "").toString().toLowerCase(),
        value: (cbo || "vacio").toString().toLowerCase()
      }));

    this.dataColumns[indexColumn]['cboFilter'] = cboFilter || [];
    this.parsedFilterColumns.add(column.matColumnDef);
  }

  private resetCboFilters() {
    if (!this.dataColumns?.length) return;

    this.dataColumns.forEach((column) => {
      if (column.isCboFilter) {
        column.cboFilter = [];
      }
    });
  }

  onCheckedRow(codigo_barra: string, ev: any) {
    const index = this.dataSource.data.findIndex(item => item.cCodigoBarra == codigo_barra);
    const idRow = this.dataSource.data[index]['id'];
    this.dataSource.data[index]['checking'] = ev.checked;

    this.invService.putCheckedInventario({ id: idRow, checked: ev.checked }).subscribe({
      next: (value) => {
        this.onNotification(value);
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      },
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

export interface cbo {
  key: any, value: any
}
