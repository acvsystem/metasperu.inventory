import { Component, Input, SimpleChanges, ViewChild, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';

@Component({
  selector: 'view-2-inventario',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule],
  templateUrl: './view-2-inventario.html',
  styleUrl: './view-2-inventario.scss',
})
export class View2Inventario implements OnInit, OnChanges, AfterViewInit {
  @Input() onDataView: Array<any> = [];
  @Input() pocketScan: any = null; // Objeto que llega del Socket: { cCodigoBarra: '...' }

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = [
    'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia', 'temporada',
    'talla', 'color', 'stock', 'conteo', 'total',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.initializeTable(this.onDataView);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['onDataView'] && changes['onDataView'].currentValue) {
      this.initializeTable(changes['onDataView'].currentValue);
    }

    if (changes['pocketScan'] && changes['pocketScan'].currentValue) {
      this.updateSingleRecord(this.pocketScan);
    }
  }

  private initializeTable(data: any[]) {
    const formattedData = data.map(item => {
      const stock = Number(item.cStock) || 0;
      const conteo = Number(item.cConteo) || 0;

      return {
        ...item,
        cStock: stock,
        cConteo: conteo,
        CTotalStock: conteo - stock
      };
    });

    this.dataSource.data = formattedData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateSingleRecord(pocketScans: any[]) {
    const data = [...this.dataSource.data];
    let cambioDetectado = false;

    pocketScans.forEach(scan => {
      const index = data.findIndex(item => item.cCodigoBarra === scan.sku);

      if (index !== -1) {
        cambioDetectado = true;
        const item = data[index];

        item.cConteo = Number(scan.total_cantidad);

        const stock = item.cStock || 0;
        item.cTotalConteo = item.cConteo - stock;
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
      return {
        'Referencia': item.cReferencia,
        'Código de Barras': item.cCodigoBarra,
        'Descripción': item.cDescripcion,
        'Departamento': item.cDepartamento,
        'Familia': item.cFamilia,
        'Stock Sistema': item.cStock,
        'Conteo Físico': item.cConteo,
        'Total Cruce': item.cTotalConteo
      };
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
}