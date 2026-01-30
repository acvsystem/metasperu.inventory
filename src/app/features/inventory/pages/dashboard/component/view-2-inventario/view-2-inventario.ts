import { Component, Input, SimpleChanges, ViewChild, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonRow, IonCol } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '@metasperu/services/inventory.service';
import * as XLSX from 'xlsx';

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
}

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
  @Input() inAsignatedSections: Array<any> = [];
  isInsertColum: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = [
    'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia', 'temporada',
    'talla', 'color', 'stock', 'total',
  ];

  dataColumns: tableColumns[] = [{ matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra' },
  { matColumnDef: 'Referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia' },
  { matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion' },
  { matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento' },
  { matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion' },
  { matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia' },
  { matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia' },
  { matColumnDef: 'temporada', titleColumn: 'Temporada', propertyValue: 'cTemporada' },
  { matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla' },
  { matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor' },
  { matColumnDef: 'color_scent', titleColumn: 'Color/Scent', propertyValue: 'cColorScent' },
  { matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock' },
  { matColumnDef: 'total', titleColumn: 'Total Conteo', propertyValue: 'cTotalConteo' }];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef) {

  }

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

    if (changes['inAsignatedSections'] && changes['inAsignatedSections'].currentValue) {
      this.asignSectionColum();
    }
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
    console.log(data);
    const formattedData = data.map(item => {
      const stock = Number(item.cStock) || 0;
      const conteo = Number(item.cConteo) || 0;


      const objReturn: Record<string, any> = {
        ...item,
        cStock: stock,
        cConteo: conteo,
        CTotalStock: conteo - stock
      }

      /* this.inAsignatedSections.map((section) => {
         objReturn[`${(section.nombre_seccion).toLowerCase()}`] = seccionObj.nombre_seccion == section.nombre_seccion ? item.total_cantidad : 0;
       });*/

      return objReturn;
    });

    this.dataSource.data = formattedData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateSingleRecord(pocketScans: any[]) {
    console.log(pocketScans);
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

        this.inAsignatedSections.map((section) => {
          if (data[index]['cCodigoBarra'] == scan.sku) {
            let defaultValue = data[index][`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] || 0;
            console.log(defaultValue);
            if (defaultValue <= 0) {
              defaultValue += parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) || 0;
            } else if (parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) > 0) {

              defaultValue = parseInt(scan[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`]) || 0;
            }


            data[index][`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = defaultValue;

          }
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