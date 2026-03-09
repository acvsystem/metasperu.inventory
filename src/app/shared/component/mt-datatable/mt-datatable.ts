import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
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
@Component({
  selector: 'mt-datatable',
  imports: [MatPaginatorModule, MatMenu, MtInput, MtSelect, MatMenuModule, MatTableModule, MatCheckboxModule],
  templateUrl: './mt-datatable.html',
  styleUrl: './mt-datatable.scss',
})
export class MtDatatable {
  @Input() dataIn: Array<any> = [];
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
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private invService: InventoryService) {
    console.log("DATA TABLE");
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataIn'] && changes['dataIn'].currentValue) {
      this.dataSource.data = changes['dataIn'].currentValue;
      this.onParserFilterCbo();
    }

    if (changes['dataColumnsIn'] && changes['dataColumnsIn'].currentValue) {
      this.dataColumns = changes['dataColumnsIn'].currentValue;
    }

    if (changes['extraColumns'] && changes['extraColumns'].currentValue) {
      this.displayedColumns = changes['extraColumns'].currentValue;
    }
  }

  ngOnInit() {
    this.dataSource.data = this.dataIn;
    this.dataColumns = this.dataColumnsIn;
    this.onParserFilterCbo();
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every(columnKey => {
        const searchTerm = searchTerms[columnKey];

        // 1. Si el filtro está vacío, pasa la fila
        if (!searchTerm || (Array.isArray(searchTerm) && searchTerm.length === 0)) {
          return true;
        }

        // 2. Lógica para 'cTotalConteo' con soporte para múltiples opciones
        if (columnKey === 'cTotalConteo') {
          const valorNumerico = data[columnKey];

          // Convertimos el searchTerm a Array siempre para manejarlo igual
          const filtrosActivos = Array.isArray(searchTerm)
            ? searchTerm.map(s => s.toString().toLowerCase())
            : [searchTerm.toString().toLowerCase()];

          // Verificamos si el valor cumple con AL MENOS UNA de las opciones seleccionadas
          return filtrosActivos.some(opcion => {
            if (opcion === 'positivo') return valorNumerico >= 1 && valorNumerico != data['cStock'];
            if (opcion === 'negativo') return valorNumerico < 0;
            if (opcion === 'cero sin escaneo') return data['cConteo'] == 0;
            if (opcion === 'cero escaneo') return (data['cConteo'] > 0 && data['cTotalConteo'] == 0) || data['cTotalConteo'] == data['cStock'];
            return false;
          });
        }

        // 3. Lógica estándar para el resto de columnas
        const cellValue = data[columnKey]?.toString().toLowerCase() || '';

        if (Array.isArray(searchTerm)) {
          return searchTerm.map(s => s.toString().toLowerCase()).includes(cellValue);
        } else {
          return cellValue.includes(searchTerm.toString().toLowerCase());
        }
      });
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

  onParserFilterCbo() {
    this.dataColumns.filter((dc, indexColumn) => {
      if (dc.isCboFilter) {
        const cboFilter = [... new Set(this.dataIn.map(item => item[dc.propertyValue]))]
          .sort()
          .map(cbo => ({
            key: (cbo || "").toLowerCase(),
            value: (cbo || "vacio").toLowerCase()
          }));

        this.dataColumns[indexColumn]['cboFilter'] = cboFilter || [];
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

export interface columnsTable {
  isSticky: boolean;
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive: boolean;
  isCboFilter: boolean;
  cboFilter: Array<cbo>
}

export interface cbo {
  key: any, value: any
}