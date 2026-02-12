import { Component, Input, SimpleChanges, ViewChild, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, inject, signal, output, EventEmitter, Output } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
}

@Component({
  selector: 'view-2-inventario',
  standalone: true,
  imports: [MatTableModule, MatCheckboxModule, IonCardContent, IonGrid, IonCard, MatBadgeModule, MatMenuModule, IonIcon, MatFormFieldModule, MtInput, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule, MatMenu],
  templateUrl: './view-2-inventario.html',
  styleUrl: './view-2-inventario.scss',
})
export class View2Inventario implements OnInit, OnChanges, AfterViewInit {
  @Input() onDataView: Array<any> = [];
  @Input() pocketScan: any = null; // Objeto que llega del Socket: { cCodigoBarra: '...' }
  @Input() inAsignatedSections: Array<any> = [];
  @Output() onChangeInventario: EventEmitter<any> = new EventEmitter();
  isInsertColum: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  inFilter: string = "";
  filterValues: any = {};
  isFilterT: boolean = false;
  totalStock = signal<number>(0);
  totalConteo = signal<number>(0);
  totalDiferencia = signal<number>(0);
  showTable = signal(false);
  progress = signal(0);
  isProcessing = signal(false);
  checkedOffline: any = "";
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
    this.onDataView = [];
    const offlineData = localStorage.getItem('offline_inventory');

    if (offlineData) {
      const inventario = JSON.parse(offlineData);
      this.onDataView = inventario;
      console.log('📦 Inventario recibido Importado:', inventario.length);
    }

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

  onChangeInv() {
    this.onChangeInventario.emit();
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


  private async initializeTable(data: any[]) {
    this.isProcessing.set(true);
    this.progress.set(0);
    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;
    const allFormattedData: any[] = [];
    const chunkSize = 200; // Tu tamaño de lote
    const total = data.length;

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      const formattedChunk = chunk.map(item => {
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

      allFormattedData.push(...formattedChunk);

      // CORRECCIÓN: Calcular el progreso basado en cuántos elementos hemos procesado YA
      // Math.min asegura que no pase del 100% si el último lote es más pequeño
      const processedSoFar = Math.min(i + chunkSize, total);
      this.progress.set(processedSoFar / total);

      // Dar respiro al navegador
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    // FORZAR 100% al terminar (por si acaso hubiera decimales mínimos)
    this.progress.set(1);

    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(totalConteoGlobal - totalStockGlobal);

    // ... (Asignación a la tabla y cálculos de totales)
    this.dataSource.data = allFormattedData;

    if (this.progress() == 1) {

      this.updateSingleRecord(this.pocketScan);
      this.isProcessing.set(false);
      this.showTable.set(true);
    }
  }


  private updateSingleRecord(pocketScans: any[]) {
    this.proccessScan(pocketScans);
  }

  proccessScan(dataPocket: Array<any>) {
    const data = [...this.dataSource.data];
    const agrupadoPorSkuYSeccion = dataPocket.reduce((acc, item) => {
      // Creamos una llave única que combine SKU e ID de sección
      const key = `${item.sku}-${item.seccion_id}`;
      const cantidad = Number(item.total_cantidad);

      if (!acc[key]) {
        // Si no existe la combinación, creamos el registro inicial
        acc[key] = {
          ...item,
          total_cantidad: cantidad
        };
      } else {
        // Si ya existe la combinación SKU-Sección, sumamos la cantidad
        acc[key].total_cantidad += cantidad;
      }

      return acc;
    }, {});

    // Convertimos a array para obtener el resultado final
    const resultadoFinal = Object.values(agrupadoPorSkuYSeccion);


    const totalesPorSku: any = resultadoFinal.reduce((acc: any, item: any) => {
      const sku = item.sku;
      acc[sku] = (acc[sku] || 0) + Number(item.total_cantidad);
      return acc;
    }, {});

    // 3. Insertamos la propiedad total_conteo en cada elemento
    const resultadoFinal2 = resultadoFinal.map((item: any) => {
      return {
        ...item,
        total_conteo: totalesPorSku[item.sku] // Asignamos la suma global del SKU
      };
    });

    let totalConteoGlobal = 0;

    (resultadoFinal2).forEach((scan: any) => {

      const index = data.findIndex(item => item.cCodigoBarra === scan.sku);
      if (index != -1) {

        this.inAsignatedSections.map((section) => {
          if (scan.seccion_id == section.id) {
            data[index][`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = scan.total_cantidad;
          }
        });

        totalConteoGlobal += scan.total_cantidad;

        data[index].cConteo = Number(scan.total_conteo);

        data[index].cTotalConteo = data[index].cTotalConteo == data[index].cStock ? data[index].cStock : data[index].cConteo - data[index].cStock;

      } else {
        let newItem: any = {
          CTotalStock: 0,
          cCodigoArticulo: 0,
          cCodigoBarra: scan.sku,
          cCodigoTienda: ((this.dataSource.data || [])[0] || {})['cCodigoTienda'],
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
        };

        this.inAsignatedSections.map((section) => {
          if (scan.seccion_id == section.id) {
            newItem[`${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`] = scan.total_cantidad
          }
        });

        data.push(newItem);
      }


      this.totalDiferencia.set(totalConteoGlobal - this.totalStock());
      this.totalConteo.set(totalConteoGlobal);
      this.dataSource.data = data;
      this.cdr.markForCheck();
    });
  }

  exportarExcel() {
    // 1. Mapeamos los datos para que el Excel tenga nombres de columnas bonitos
    const dataParaExportar = this.dataSource.data.map(item => {

      const objReturn: Record<string, any> = {
        cCodigoArticulo: item.cCodigoArticulo,
        cCodigoBarra: item.cCodigoBarra,
        cCodigoTienda: item.cCodigoTienda,
        cColor: item.cColor,
        cConteo: item.cConteo,
        cDepartamento: item.cDepartamento,
        cDescripcion: item.cDescripcion,
        cFamilia: item.cFamilia,
        cReferencia: item.cReferencia,
        cSeccion: item.cSeccion,
        cSessionCode: item.cSessionCode,
        cStock: item.cStock,
        cSubFamilia: item.cSubFamilia,
        cTalla: item.cTalla,
        cTemporada: item.cTemporada,
        cTotalConteo: item.cTotalConteo,
        codigo_sesion: item.codigo_sesion,
        id: item.id
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

  importExcelInventario(event: any) {
    console.log(event);
    this.onDataView = [];
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      // 1. Leer el archivo
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // 2. Obtener la primera hoja
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // 3. Convertir a JSON (Array de objetos)
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      // 5. GUARDAR PARA MODO OFFLINE
      localStorage.setItem('offline_inventory', JSON.stringify(rawData));

      console.log(rawData);
      // 6. Cargar en la tabla
      this.onDataView = rawData;
      console.log('📦 Inventario Importado:', rawData.length);

      await this.initializeTable(rawData);
    };

    reader.readAsArrayBuffer(file);
  }

}