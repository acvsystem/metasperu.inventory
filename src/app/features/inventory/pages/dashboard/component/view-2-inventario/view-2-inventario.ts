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
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { InventoryService } from '@metasperu/services/inventory.service';

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
  cboFilter: Array<any>;
}

@Component({
  selector: 'view-2-inventario',
  standalone: true,
  imports: [MatTableModule, MatCheckboxModule, MtSelect, IonCardContent, IonGrid, IonCard, MatBadgeModule, MatMenuModule, IonIcon, MatFormFieldModule, MtInput, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule, MatMenu],
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
  datosFiltradosActuales: any[] = [];
  stockFilter: number = 0;
  conteoFilter: number = 0;
  diferenciaFilter: number = 0;
  displayedColumns = [
    'checking', 'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia', 'temporada',
    'talla', 'color', 'stock', 'total',
  ];

  dataColumns: tableColumns[] = [
    { matColumnDef: 'checking', titleColumn: 'Revisado', propertyValue: 'checking', filterActive: false, cboFilter: [{ key: 1, value: 'Revisado' }, { key: 0, value: 'Sin Revisar' }] },
    { matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra', filterActive: false, cboFilter: [] },
    { matColumnDef: 'Referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia', filterActive: false, cboFilter: [] },
    { matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion', filterActive: false, cboFilter: [] },
    { matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento', filterActive: false, cboFilter: [] },
    { matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion', filterActive: false, cboFilter: [] },
    { matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia', filterActive: false, cboFilter: [] },
    { matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia', filterActive: false, cboFilter: [] },
    { matColumnDef: 'temporada', titleColumn: 'Temporada', propertyValue: 'cTemporada', filterActive: false, cboFilter: [] },
    { matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false, cboFilter: [] },
    { matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false, cboFilter: [] },
    { matColumnDef: 'color_scent', titleColumn: 'Color/Scent', propertyValue: 'cColorScent', filterActive: false, cboFilter: [] },
    { matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock', filterActive: false, cboFilter: [] },
    { matColumnDef: 'total', titleColumn: 'Total Conteo', propertyValue: 'cTotalConteo', filterActive: false, cboFilter: [{ key: 'Positivo', value: 'Positivo' }, { key: 'Negativo', value: 'Negativo' }, { key: 'cero sin escaneo', value: 'cero sin escaneo' }, { key: 'cero escaneo', value: 'cero escaneo' }] }];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef, private invService: InventoryService) {

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
    //this.updateSingleRecord(this.pocketScan);

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
            if (opcion === 'positivo') return valorNumerico > 0;
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

  applyFilterTable(event: any, column: string, cboValue?: string) {

    const filterValue = cboValue?.length ? cboValue : (event.target as HTMLInputElement).value;

    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);
    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;

    this.filterValues[property?.propertyValue] = (cboValue || "").length ? cboValue : filterValue.trim().toLowerCase();

    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.datosFiltradosActuales = this.dataSource.filteredData;

    this.processDataFilter();
  }

  private asignSectionColum() {
    if (!this.isInsertColum) {
      this.inAsignatedSections.map((section, i) => {
        this.dataColumns.push({ matColumnDef: (section.nombre_seccion).toLowerCase(), titleColumn: section.nombre_seccion, propertyValue: `${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`, cboFilter: [] });
        this.displayedColumns.push((section.nombre_seccion).toLowerCase());
      });

      this.isInsertColum = true;
    }
  }

  private processDataFilter() {
    // Calculamos los totales usando reduce
    const totales = this.datosFiltradosActuales.reduce((acc, curr) => {
      const conteo = Number(curr.cConteo) || 0;
      const stock = Number(curr.cStock) || 0;
      const diferencia = conteo - stock;

      return {
        sumaConteo: acc.sumaConteo + conteo,
        sumaStock: acc.sumaStock + stock,
        sumaDiferencia: acc.sumaDiferencia + diferencia
      };
    }, { sumaConteo: 0, sumaStock: 0, sumaDiferencia: 0 });

    // Imprimir resultados
    this.stockFilter = totales.sumaStock;
    this.conteoFilter = totales.sumaConteo;
    this.diferenciaFilter = totales.sumaDiferencia;
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
      this.onColumsFilterCbo(allFormattedData);
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

    // 1. Crear un Map para búsqueda rápida de items existentes por SKU
    const dataMap = new Map(data.map((item, index) => [item.cCodigoBarra, { item, index }]));

    // 2. Agrupar dataPocket por SKU y por Seccion en un solo paso
    const agrupado = new Map<string, any>();
    const totalesPorSku = new Map<string, number>();

    dataPocket.forEach(item => {
      const key = `${item.sku}-${item.seccion_id}`;
      const cantidad = Number(item.total_cantidad) || 0;

      // Agrupación por SKU-Sección
      if (!agrupado.has(key)) {
        agrupado.set(key, { ...item, total_cantidad: cantidad });
      } else {
        agrupado.get(key).total_cantidad += cantidad;
      }

      // Acumular total global por SKU
      totalesPorSku.set(item.sku, (totalesPorSku.get(item.sku) || 0) + cantidad);
    });

    // 3. Crear un mapa de secciones para evitar el .map interno
    const seccionesMap = new Map(this.inAsignatedSections.map(s => [
      s.id,
      s.nombre_seccion.replace(/\s+/g, "_").toLowerCase()
    ]));

    let totalConteoGlobal = 0;

    // 4. Procesar los resultados agrupados
    agrupado.forEach((scan) => {
      const skuTotal = totalesPorSku.get(scan.sku) || 0;
      const sectionProp = seccionesMap.get(scan.seccion_id);
      const existing = dataMap.get(scan.sku);

      if (existing) {
        const { item, index } = existing;

        // Actualizar columna dinámica de sección
        if (sectionProp) {
          data[index][sectionProp] = scan.total_cantidad;
        }

        data[index].cConteo = skuTotal;

        // Lógica de diferencia (corregida para evitar confusiones)
        data[index].cTotalConteo = data[index].cConteo === data[index].cStock
          ? data[index].cStock
          : data[index].cConteo - data[index].cStock;

      } else {
        // Crear nuevo item si no existe
        const newItem: any = {
          CTotalStock: 0,
          cCodigoArticulo: 0,
          cCodigoBarra: scan.sku,
          cCodigoTienda: (data[0] || {}).cCodigoTienda || '',
          cColor: "",
          cConteo: skuTotal,
          cDescripcion: "",
          cStock: 0,
          cTotalConteo: 0 - 0 // Inicializar diferencia
        };

        if (sectionProp) {
          newItem[sectionProp] = scan.total_cantidad;
        }

        data.push(newItem);
        // Actualizamos el mapa por si el mismo SKU viene en otra sección en este mismo loop
        dataMap.set(scan.sku, { item: newItem, index: data.length - 1 });
      }
    });

    // 5. Cálculos globales finales (FUERA del bucle)
    const sumaTotalScaneada = Array.from(totalesPorSku.values()).reduce((a, b) => a + b, 0);

    this.totalConteo.set(sumaTotalScaneada);
    this.totalDiferencia.set(sumaTotalScaneada - this.totalStock());

    this.dataSource.data = data;
    this.cdr.markForCheck();
  }


  exportarExcel() {
    // 1. Mapeamos los datos (Tu lógica se mantiene igual)
    const dataParaExportar = this.dataSource.data.map(item => {
      const objReturn: Record<string, any> = {
        id: item.id,
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
        cTotalConteo: item.cConteo == 0 ? item.cStock * -1 : item.cTotalConteo,
        cEstadoEscaneo: item.cConteo == 0 ? 'NO ESCANEADO' : 'ESCANEADO',
      };
      return objReturn;
    });

    // 2. Creamos la hoja de trabajo
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);

    // 3. --- LÓGICA PARA PINTAR CELDAS ---
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Empezamos en +1 para saltar el encabezado
      // Buscamos la columna 'cEstadoEscaneo'. 
      // Si sabes que es la columna 17 (por ejemplo), puedes usarla directo.
      const estadoCellAddress = XLSX.utils.encode_cell({ r: R, c: 16 }); // Ajusta el índice de columna
      const cell = worksheet[estadoCellAddress];

      if (cell && cell.v === 'NO ESCANEADO') {
        // Pintamos toda la fila o solo esa celda
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[address]) continue;

          worksheet[address].s = {
            fill: {
              fgColor: { rgb: "FFFF0000" } // Rojo (Formato ARGB)
            },
            font: {
              color: { rgb: "FFFFFF" }, // Texto blanco para que resalte
              bold: true
            }
          };
        }
      }
    }

    // 4. Generamos el libro y descargamos
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Inventario': worksheet },
      SheetNames: ['Inventario']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
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

      const formattedData = rawData.map(item => ({
        checking: 0,
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
        cTotalConteo: 0,
        codigo_sesion: item.codigo_sesion,
        id: item.id
      }));

      // 5. GUARDAR PARA MODO OFFLINE
      localStorage.setItem('offline_inventory', JSON.stringify(formattedData));

      // 6. Cargar en la tabla
      this.onDataView = formattedData;
      console.log('📦 Inventario Importado:', formattedData.length);

      this.onColumsFilterCbo(formattedData);

      await this.initializeTable(formattedData);
    };

    reader.readAsArrayBuffer(file);
  }

  onColumsFilterCbo(dataTable: any) {
    this.onParserFilterCbo('cDepartamento', dataTable);
    this.onParserFilterCbo('cSeccion', dataTable);
    this.onParserFilterCbo('cFamilia', dataTable);
    this.onParserFilterCbo('cSubFamilia', dataTable);
  }

  onParserFilterCbo(property: string, data: Array<any>) {
    const cboFilter = [... new Set(data.map(item => item[property]))]
      .sort()
      .map(distrito => ({
        key: distrito.toLowerCase(),
        value: distrito.toLowerCase()
      }));

    const indexColumn = this.dataColumns.findIndex((c) => c.propertyValue == property);

    this.dataColumns[indexColumn]['cboFilter'] = cboFilter || [];

  }


  async onChangeSelect(data: any, column: string) {
    const selectData = data.map((item: any) => item.key);
    this.applyFilterTable('', column, selectData);
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