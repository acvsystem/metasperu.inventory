import { Component, Input, SimpleChanges, ViewChild, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { MatMenu } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
}

@Component({
  selector: 'view-2-inventario',
  standalone: true,
  imports: [MatTableModule, IonCardContent, IonGrid, IonCard, MatBadgeModule, MatMenuModule, IonIcon, MatFormFieldModule, MtInput, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule, MatMenu],
  templateUrl: './view-2-inventario.html',
  styleUrl: './view-2-inventario.scss',
})
export class View2Inventario implements OnInit, OnChanges, AfterViewInit {
  @Input() onDataView: Array<any> = [];
  @Input() pocketScan: any = null; // Objeto que llega del Socket: { cCodigoBarra: '...' }
  @Input() inAsignatedSections: Array<any> = [];
  isInsertColum: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  inFilter: string = "";
  filterValues: any = {};
  isFilterT: boolean = false;
  totalStock = signal<number>(0);
  totalConteo = signal<number>(0);
  totalDiferencia = signal<number>(0);

  displayedColumns = [
    'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia', 'temporada',
    'talla', 'color', 'stock', 'total',
  ];

  dataColumns: tableColumns[] = [{ matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra', filterActive: false },
  { matColumnDef: 'Referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia', filterActive: false },
  { matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion', filterActive: false },
  { matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento', filterActive: false },
  { matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion', filterActive: false },
  { matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia', filterActive: false },
  { matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia', filterActive: false },
  { matColumnDef: 'temporada', titleColumn: 'Temporada', propertyValue: 'cTemporada', filterActive: false },
  { matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false },
  { matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false },
  { matColumnDef: 'color_scent', titleColumn: 'Color/Scent', propertyValue: 'cColorScent', filterActive: false },
  { matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock', filterActive: false },
  { matColumnDef: 'total', titleColumn: 'Total Conteo', propertyValue: 'cTotalConteo', filterActive: false }];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.initializeTable(this.onDataView);
    this.asignSectionColum();
    this.updateSingleRecord(this.pocketScan);

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every(columnKey => {
        const cellValue = data[columnKey]?.toString().toLowerCase() || '';
        return cellValue.includes(searchTerms[columnKey]);
      });
    };

  }

  ngAfterViewInit() {

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(this.onDataView);
    if (changes['onDataView'] && changes['onDataView'].currentValue) {
      this.initializeTable(changes['onDataView'].currentValue);
    }

    if (changes['pocketScan'] && changes['pocketScan'].currentValue) {
      this.updateSingleRecord(this.pocketScan);
    }

    if (changes['inAsignatedSections'] && changes['inAsignatedSections'].currentValue) {
      this.asignSectionColum();
    }
  }

  applyFilterTable(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;

    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);
    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;
    this.filterValues[property?.propertyValue] = filterValue.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  private asignSectionColum() {
    if (!this.isInsertColum) {
      this.inAsignatedSections.map((section, i) => {
        this.dataColumns.push({ matColumnDef: (section.nombre_seccion).toLowerCase(), titleColumn: section.nombre_seccion, propertyValue: `${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}` });
        this.displayedColumns.push((section.nombre_seccion).toLowerCase());
      });

      this.isInsertColum = true;
    }
  }

  private initializeTable(data: any[]) {
    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;

    console.log(data);

    const formattedData = data.map(item => {
      const stock = Number(item.cStock) || 0;
      const conteo = Number(item.cConteo) || 0;

      // Acumulamos los valores en cada iteración
      totalStockGlobal += stock;
      totalConteoGlobal += conteo;

      const objReturn: Record<string, any> = {
        ...item,
        cStock: stock,
        cConteo: conteo,
        CTotalStock: item.cConteo == item.cStock ? stock : conteo - stock
      }

      return objReturn;
    });

    // Guardamos los totales en señales (Signals) para el Dashboard
    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(totalConteoGlobal - totalStockGlobal);

    this.dataSource.data = formattedData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateSingleRecord(pocketScans: any[]) {
    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;
    const data = [...this.dataSource.data];
    let cambioDetectado = false;

    pocketScans.forEach(scan => {
      const index = data.findIndex(item => item.cCodigoBarra === scan.sku);

      if (index !== -1) {
        cambioDetectado = true;
        const item = data[index];

        const stock = Number(item.cStock) || 0;
        const conteo = Number(item.cConteo) || 0;

        totalStockGlobal += stock;


        item.cConteo = Number(scan.total_cantidad);
        item.cTotalConteo = item.cConteo == item.cStock ? stock : item.cConteo - stock;


        this.inAsignatedSections.map((section) => {
          if (data[index]['cCodigoBarra'] == scan.sku) {
            let defaultValue = data[index][`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] || 0;

            if (defaultValue <= 0) {
              defaultValue += parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) || 0;
            } else if (parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) > 0) {

              defaultValue = parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) || 0;
            }

            totalConteoGlobal += defaultValue;
            data[index][`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = defaultValue;

          }
        });

        this.totalConteo.set(totalConteoGlobal);
        this.totalDiferencia.set(totalConteoGlobal - this.totalStock());
      } else {
        cambioDetectado = true;
        data.push({
          CTotalStock: 0,
          cCodigoArticulo: 0,
          cCodigoBarra: scan.sku,
          cCodigoTienda: this.dataSource.data[0]['cCodigoTienda'],
          cColor: "",
          cConteo: 1,
          cDepartamento: "",
          cDescripcion: "",
          cFamilia: "",
          cReferencia: "",
          cSeccion: "",
          cSessionCode: scan.session_code,
          cStock: 0,
          cSubFamilia: "",
          cTalla: "",
          cTemporada: "",
          cTotalConteo: 0
        });
      }
    });

    if (cambioDetectado) {
      this.dataSource.data = data;
      this.cdr.markForCheck();
    }
  }

  exportarExcel() {
    // 1. Mapeamos los datos para que el Excel tenga nombres de columnas bonitos
    const dataParaExportar = this.dataSource.data.map(item => {

      const objReturn: Record<string, any> = {
        'Referencia': item.cReferencia,
        'Código de Barras': item.cCodigoBarra,
        'Descripción': item.cDescripcion,
        'Departamento': item.cDepartamento,
        'Familia': item.cFamilia,
        'Stock Sistema': item.cStock,
        'Conteo Físico': item.cConteo,
        'Total Cruce': item.cTotalConteo
      };

      this.inAsignatedSections.map((section) => {
        objReturn[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = item[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`];
      });



      return objReturn;


    });

    // 2. Creamos el libro y la hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventario': worksheet },
      SheetNames: ['Inventario']
    };

    // 3. Generamos el archivo y lo descargamos
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(worksheet['!ref']!)) };
    this.saveAsExcelFile(excelBuffer, 'Cruce_Inventario');
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName + '_' + new Date().getTime() + '.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  applyFilter(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.inFilter = value ?? "";
    const filterValue = value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

}