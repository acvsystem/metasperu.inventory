import { Component, Input, SimpleChanges, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, signal, EventEmitter, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
//import * as XLSX from 'xlsx';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ModalReport } from './component/modal-report/modal-report';
import { MtDatatable } from '@metasperu/component/mt-datatable/mt-datatable';
import { MtLoader } from '@metasperu/component/mt-loader/mt-loader';
import * as XLSX from 'xlsx-js-style';

const toNumber = (value: any) => {
  const numericValue = typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const numberValue = Number(numericValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const inventoryDifference = (conteo: any, stock: any) => {
  const conteoValue = toNumber(conteo);
  const stockValue = toNumber(stock);
  return conteoValue - Math.abs(stockValue);
};

const sectionColumnKey = (name: string) => (name || '').trim().replace(/\s+/g, '_').toLowerCase();

export interface tableColumns {
  isSticky: boolean;
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive: boolean;
  isCboFilter: boolean;
  cboFilter: Array<any>;
}

@Component({
  selector: 'view-2-inventario',
  standalone: true,
  imports: [MtDatatable, MtLoader, MatTableModule, MatTooltipModule, BaseChartDirective, MatSidenavModule, MatCheckboxModule, MtSelect, IonCardContent, IonGrid, IonCard, MatBadgeModule, MatMenuModule, IonIcon, MatFormFieldModule, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule],
  templateUrl: './view-2-inventario.html',
  styleUrl: './view-2-inventario.scss',
})
export class View2Inventario implements OnInit, OnChanges, AfterViewInit {
  @Input() onDataView: Array<any> = [];
  @Input() pocketScan: any = null; // Objeto del Socket: { sku: '...', total_cantidad: ... }
  @Input() inAsignatedSections: Array<any> = [];
  @Input() onDataConteo: Array<any> = [];
  @Input() isReporte: boolean = false;
  @Output() onChangeInventario: EventEmitter<any> = new EventEmitter();
  @Output() onAllDataProcess: EventEmitter<any> = new EventEmitter();
  isInsertColum: boolean = false;
  dataTable: Array<any> = [];
  inFilter: string = "";
  filterValues: any = {};
  isFilterT: boolean = false;
  isLoading: boolean = true;
  titleLoader: string = 'Cargando Inventario...';
  totalStock = signal<number>(0);
  totalConteo = signal<number>(0);
  totalDiferencia = signal<number>(0);
  showTable = signal(false);
  progress = signal(0);
  isProcessing = signal(false);
  private tableBuildToken = 0;

  datosFiltradosActuales: any[] = [];
  stockFilter: number = 0;
  conteoFilter: number = 0;
  diferenciaFilter: number = 0;

  // Configuración del gráfico de Torta (Secciones)
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  // Configuración del gráfico de Barras (Usuarios)
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  displayedColumns: Array<string> = [
    'checking', 'codigoBarra', 'codigoBarra2', 'codigoBarra3', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia',
    'talla', 'color', 'Esencia', 'style_description', 'stock', 'total', 'conteo',
  ];

  extraColumns: Array<string> = [];
  zonasSub: Array<string> = [];
  dataZonas: Array<string> = [];
  arTipoExport: Array<any> = [{ key: 'aInterna', value: 'Auditoria Interna', isDefault: true }, { key: 'aGeneral', value: 'Auditoria General' }];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { title: { display: true, text: 'Cantidades por Usuario' } }
  };

  cboStadictics: Array<any> = [{ key: 'cDepartamento', value: 'Departamento' }, { key: 'cSeccion', value: 'Seccion' }, { key: 'cFamilia', value: 'Familia' }, { key: 'cSubFamilia', value: 'SubFamilia' }];
  tipoReporte: string = 'general';

  dataColumns: tableColumns[] = [
    { isSticky: true, matColumnDef: 'checking', titleColumn: 'Revisado', propertyValue: 'checking', filterActive: false, isCboFilter: false, cboFilter: [{ key: 1, value: 'Revisado' }, { key: 0, value: 'Sin Revisar' }] },
    { isSticky: true, matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: true, matColumnDef: 'codigoBarra2', titleColumn: 'Codigo Barra 2', propertyValue: 'cCodigoBarra2', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: true, matColumnDef: 'codigoBarra3', titleColumn: 'Codigo Barra 3', propertyValue: 'cCodigoBarra3', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'Referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'Esencia', titleColumn: 'Esencia', propertyValue: 'cEsencia', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'style_description', titleColumn: 'Style Description', propertyValue: 'cStyleDesc', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'total', titleColumn: 'Total Conteo', propertyValue: 'cTotalConteo', filterActive: false, isCboFilter: false, cboFilter: [{ key: 'Positivo', value: 'Positivo' }, { key: 'Negativo', value: 'Negativo' }, { key: 'cero sin escaneo', value: 'Cero sin escaneo' }, { key: 'cero con escaneo', value: 'Cero con escaneo' }] },
    { isSticky: false, matColumnDef: 'conteo', titleColumn: 'Conteo', propertyValue: 'cConteo', filterActive: false, isCboFilter: false, cboFilter: [] }
  ];

  private readonly baseDisplayedColumns = [...this.displayedColumns];
  private readonly baseDataColumns = this.dataColumns.map(column => ({
    ...column,
    cboFilter: [...column.cboFilter]
  }));

  constructor(private dialog: MatDialog, private cdr: ChangeDetectorRef, private invService: InventoryService) { }

  ngAfterViewInit() { }

  ngOnInit() {

    console.log('v.1.0.0');

    const offlineData = localStorage.getItem('offline_inventory');

    if (offlineData) {
      this.onDataView = JSON.parse(offlineData);
      console.log('📦 Inventario recibido Importado offlineData:', this.onDataView);
    }
    if (this.onDataView?.length) {
      console.log('📦 Inventario recibido Importado onDataView:', this.onDataView);
      this.scheduleInitializeTable(this.onDataView);
    } else {
      this.isLoading = false;
    }

    this.onZonesList();
    this.onZonaSub();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['onDataView'] && changes['onDataView'].currentValue) {
      this.scheduleInitializeTable(changes['onDataView'].currentValue);
    }

    if (changes['pocketScan'] && changes['pocketScan'].currentValue) {
      this.updateSingleRecord(this.pocketScan);
    }

    if (changes['inAsignatedSections'] && changes['inAsignatedSections'].currentValue) {
      this.asignSectionColum();
    }
  }

  asignSectionColum() {
    // 1. Si no hay secciones asignadas, no hacemos nada
    if (!this.inAsignatedSections || this.inAsignatedSections.length === 0) return;

    const activeSections = this.getActiveAssignedSections();
    this.dataColumns = this.baseDataColumns.map(column => ({
      ...column,
      cboFilter: [...column.cboFilter]
    }));
    this.displayedColumns = [...this.baseDisplayedColumns];
    this.extraColumns = activeSections.map((s) => s.nombre_seccion);

    if (activeSections.length === 0) {
      this.isInsertColum = true;
      this.cdr.markForCheck();
      return;
    }

    const columnasExistentes = new Set<string>(this.displayedColumns);

    const nuevasColumnas: tableColumns[] = [];
    const nuevosDefs: string[] = [];

    activeSections.forEach((section) => {
      // Convertimos a minúsculas y limpiamos espacios tal como lo procesa tu código
      const colDef = sectionColumnKey(section.nombre_seccion);

      // 3. CONTROL CRÍTICO: Solo agregamos la columna si NO existe ya en el Set
      if (!columnasExistentes.has(colDef)) {
        columnasExistentes.add(colDef); // La registramos en el Set para evitar que se duplique en este mismo bucle
        nuevosDefs.push(colDef);

        nuevasColumnas.push({
          isSticky: false,
          matColumnDef: colDef,
          titleColumn: section.nombre_seccion,
          propertyValue: colDef,
          filterActive: false,
          isCboFilter: false,
          cboFilter: []
        });
      } else {
        console.warn(`⚠️ Se detectó y omitió una columna duplicada: ${colDef}`);
      }
    });

    // 4. Insertamos de un solo golpe únicamente si encontramos columnas verdaderamente nuevas
    if (nuevasColumnas.length > 0) {
      this.dataColumns = [...this.dataColumns, ...nuevasColumnas];
      this.displayedColumns = [...this.displayedColumns, ...nuevosDefs];
    }
    console.log('📊 Columnas finales para la tabla:', this.dataTable);
    this.isInsertColum = true;
    this.cdr.markForCheck();
  }

  private getActiveAssignedSections() {
    const activeKeys = new Set<string>();

    this.dataTable.forEach((item) => {
      this.inAsignatedSections.forEach((section) => {
        const sectionKey = sectionColumnKey(section.nombre_seccion);
        if (toNumber(item[sectionKey]) !== 0) {
          activeKeys.add(sectionKey);
        }
      });
    });

    return this.inAsignatedSections.filter((section) =>
      activeKeys.has(sectionColumnKey(section.nombre_seccion))
    );
  }

  onChangeInv() {
    this.onChangeInventario.emit(this.dataTable);
  }

  openVerification() {
    this.dialog.open(ModalReport, {
      width: '420px',
      panelClass: 'custom-notification-panel',
      data: this.dataTable
    });
  }

  processDataFilter(currentData: any) {
    console.log('Procesando datos filtrados:', currentData);
    const totales = currentData.reduce((acc: any, curr: any) => {
      const conteo = toNumber(curr.cConteo);
      const stock = toNumber(curr.cStock);

      return {
        sumaConteo: acc.sumaConteo + conteo,
        sumaStock: acc.sumaStock + stock,
        sumaDiferencia: acc.sumaDiferencia + inventoryDifference(conteo, stock)
      };
    }, { sumaConteo: 0, sumaStock: 0, sumaDiferencia: 0 });

    this.stockFilter = totales.sumaStock;
    this.conteoFilter = totales.sumaConteo;
    this.diferenciaFilter = totales.sumaDiferencia;
    this.cdr.markForCheck();
  }

  private scheduleInitializeTable(data: any[]) {
    const token = ++this.tableBuildToken;
    this.isLoading = true;
    this.isProcessing.set(true);
    this.showTable.set(false);
    this.cdr.detectChanges();

    setTimeout(() => {
      if (token !== this.tableBuildToken) return;

      this.initializeTable(data);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private initializeTable(data: any[]) {
    if (!data || data.length === 0) {
      this.dataTable = [];
      this.isProcessing.set(false);
      this.showTable.set(false);
      return;
    }

    this.isProcessing.set(true);
    this.progress.set(0);

    let totalStockGlobal = 0;
    let totalConteoGlobal = 0;

    // OPTIMIZACIÓN: Mapeo lineal de CPU a la velocidad de la luz. Elimina la fragmentación por chunks de 200.
    this.dataTable = data.map(item => {
      const stock = toNumber(item.cStock);
      const conteo = toNumber(item.cConteo);

      totalStockGlobal += stock;
      totalConteoGlobal += conteo;

      return {
        ...item,
        cStock: stock,
        cConteo: conteo,
        cTotalConteo: inventoryDifference(conteo, stock)
      };
    });

    this.invService.onInventoryArea.emit(data);

    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(this.dataTable.reduce((acc, item) => acc + inventoryDifference(item.cConteo, item.cStock), 0));

    this.progress.set(1);
    this.isProcessing.set(false);
    this.showTable.set(true);

    if (this.pocketScan) {
      this.updateSingleRecord(this.pocketScan);
    } else {
      this.asignSectionColum();
    }

    this.cdr.markForCheck();

    this.cacheAllTableData();

    this.onBarStadisctic([]);
  }

  private cacheAllTableData() {
    this.onAllDataProcess.emit(this.dataTable);
  }

  private updateSingleRecord(pocketScans: any[]) {
    if (!pocketScans) return;
    this.proccessScan(pocketScans);
  }

  proccessScan(dataPocket: Array<any>) {
    const data = [...this.dataTable];

    // 1. Mapa con los 3 códigos apuntando al mismo registro
    const dataMap = new Map<string, { item: any; index: number }>();

    data.forEach((item, index) => {
      const entry = { item, index };
      if (item.cCodigoBarra) dataMap.set(String(item.cCodigoBarra), entry);
      if (item.cCodigoBarra2) dataMap.set(String(item.cCodigoBarra2), entry);
      if (item.cCodigoBarra3) dataMap.set(String(item.cCodigoBarra3), entry);
    });

    // 2. Agrupamos por el registro real (no por el código escaneado)
    const agrupado = new Map<string, any>();          // key: productKey-seccion
    const totalesPorProducto = new Map<string, number>(); // key: productKey → total

    dataPocket.forEach(item => {
      const scannedCode = String(item.sku);
      const existing = dataMap.get(scannedCode);

      // Clave estable del producto (preferimos el código principal del registro)
      let productKey: string;
      if (existing) {
        productKey = String(
          existing.item.cCodigoBarra ||
          existing.item.cCodigoBarra2 ||
          existing.item.cCodigoBarra3 ||
          scannedCode
        );
      } else {
        productKey = scannedCode; // es un producto nuevo
      }

      const key = `${productKey}-${item.seccion_id}`;
      const cantidad = toNumber(item.total_cantidad);

      if (!agrupado.has(key)) {
        agrupado.set(key, {
          ...item,
          sku: productKey,               // importante: usamos la clave estable
          total_cantidad: cantidad,
          _matchedIndex: existing ? existing.index : null
        });
      } else {
        agrupado.get(key).total_cantidad += cantidad;
      }

      // Total general del producto (suma de todos los códigos que pertenecen a él)
      totalesPorProducto.set(
        productKey,
        (totalesPorProducto.get(productKey) || 0) + cantidad
      );
    });

    const seccionesMap = new Map(this.inAsignatedSections.map(s => [
      s.id,
      sectionColumnKey(s.nombre_seccion)
    ]));

    // 3. Aplicamos los totales al dataTable
    agrupado.forEach((scan) => {
      const productKey = scan.sku;
      const skuTotal = totalesPorProducto.get(productKey) || 0;
      const sectionProp = seccionesMap.get(scan.seccion_id);

      // Preferimos el índice que ya resolvimos
      let index: number | null = scan._matchedIndex;

      if (index === null) {
        const existing = dataMap.get(productKey);
        index = existing ? existing.index : null;
      }

      if (index !== null) {
        // Actualizamos el registro existente
        if (sectionProp) {
          data[index][sectionProp] = scan.total_cantidad;
        }
        data[index].cConteo = skuTotal;
        data[index].cTotalConteo = inventoryDifference(data[index].cConteo, data[index].cStock);
      } else {
        // Producto nuevo
        const newItem: any = {
          cCodigoArticulo: 0,
          cCodigoBarra: productKey,
          cCodigoBarra2: null,
          cCodigoBarra3: null,
          cCodigoTienda: (data[0] || {}).cCodigoTienda || '',
          cColor: "",
          cConteo: skuTotal,
          cDescripcion: "",
          cStock: 0,
          cTotalConteo: skuTotal
        };

        if (sectionProp) {
          newItem[sectionProp] = scan.total_cantidad;
        }

        data.push(newItem);
        // Lo registramos en el mapa por si hay más scans del mismo código
        dataMap.set(productKey, { item: newItem, index: data.length - 1 });
      }
    });

    // 4. Totales generales (igual que antes)
    const sumaTotalScaneada = data.reduce((acc, item) => acc + toNumber(item.cConteo), 0);
    const sumaStock = data.reduce((acc, item) => acc + toNumber(item.cStock), 0);

    this.totalConteo.set(sumaTotalScaneada);
    this.totalStock.set(sumaStock);
    this.totalDiferencia.set(
      data.reduce((acc, item) => acc + inventoryDifference(item.cConteo, item.cStock), 0)
    );

    this.dataTable = data;

    this.asignSectionColum();
    this.onBarStadisctic(data);
    this.cdr.markForCheck();
    this.invService.onInventoryArea.emit(data);
    this.cacheAllTableData();
  }

  exportarExcel() {
    const dataParaExportar = this.getInventoryExportRows(this.dataTable);
    const noEscaneados = dataParaExportar.filter(item => toNumber(item.cConteo) === 0);
    const diferencias = dataParaExportar.filter(item => toNumber(item.cTotalConteo) !== 0);
    const stockNegativo = dataParaExportar.filter(item => toNumber(item.cStock) < 0);
    const skuDesconocido = dataParaExportar.filter(item => this.isUnknownSku(item));

    const workbook: XLSX.WorkBook = {
      Sheets: {},
      SheetNames: []
    };

    const worksheet = this.createWorksheet(dataParaExportar);
    this.paintNoScannedRows(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    this.appendSheet(workbook, 'Resumen', this.getSummaryRows(dataParaExportar, noEscaneados, diferencias, stockNegativo, skuDesconocido));
    this.appendSheet(workbook, 'No Escaneados', noEscaneados);
    this.appendSheet(workbook, 'Diferencias', diferencias);
    this.appendSheet(workbook, 'Stock Negativo', stockNegativo);
    this.appendSheet(workbook, 'SKU Desconocido', skuDesconocido);

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'Cruce_Inventario');
  }

  exportarExcelGeneral() {
    console.log(this.onDataConteo);
    const dataParse = this.dataTable.map(item => ({
      ...item,
      cCodigoBarra: item.cCodigoBarra
        ? String(item.cCodigoBarra).replace(/^0+/, '')
        : item.cCodigoBarra
    }));

    const dataParaExportar = this.getInventoryExportRowsGeneral(dataParse);
    const dataConteoExportar = this.onDataConteo;
    const dataInformeDiferencias = this.getInformeDiferenciasRows(dataParse);
    const dataConteos = this.getInventoryExportRowsConteos(dataParse);   // ← nueva

    const workbook: XLSX.WorkBook = XLSX.utils.book_new();

    // MATRIZ
    const worksheet = this.createWorksheet(dataParaExportar);
    this.paintNoScannedRows(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MATRIZ');

    // SUBZONAS
    this.appendSheet(workbook, 'SUBZONAS', dataConteoExportar);

    // INFORME DIFERENCIAS
    const wsInforme = XLSX.utils.aoa_to_sheet(dataInformeDiferencias);
    wsInforme['!cols'] = [
      { wch: 22 }, { wch: 45 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsInforme, 'INFORME DIFERENCIAS');

    // ===== NUEVA PESTAÑA CONTEOS =====
    const wsConteos = this.createWorksheet(dataConteos);
    XLSX.utils.book_append_sheet(workbook, wsConteos, 'CONTEOS');

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, 'Cruce_Inventario');
  }

  private getInformeDiferenciasRows(data: any[]): any[][] {
    const rows: any[][] = [];

    // Título principal
    rows.push([{
      v: 'INFORME DE DIFERENCIAS DE INVENTARIO',
      t: 's',
      s: {
        font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center' }
      }
    }]);
    rows.push([]); // fila vacía

    // ===== 1. Normalizar y agrupar el detalle por código de barras (sin ceros a la izquierda) =====
    const detallePorCodigo: { [codigo: string]: any[] } = {};

    (this.onDataConteo || []).forEach((d: any) => {
      // Ignorar RECONTEO
      if (
        String(d.ZONA || '').toUpperCase() === 'RECONTEO' ||
        String(d.SUBZONA || '').toUpperCase() === 'RECONTEO'
      ) {
        return;
      }

      const codigoLimpio = String(d.CODBARRAS || '').replace(/^0+/, '');
      if (!codigoLimpio) return;

      if (!detallePorCodigo[codigoLimpio]) {
        detallePorCodigo[codigoLimpio] = [];
      }
      detallePorCodigo[codigoLimpio].push(d);
    });

    // ===== 2. Procesar productos =====
    const productosConDiferencia = data
      .map(item => {
        const codigoLimpio = String(item.cCodigoBarra || '').replace(/^0+/, '');

        // Tomamos el detalle ya agrupado (sin RECONTEO)
        const detalles = detallePorCodigo[codigoLimpio] || [];

        // Calculamos el físico sumando las unidades del detalle
        const fisico = detalles.reduce((sum, d) => sum + toNumber(d.UNIDADES), 0);
        const stock = toNumber(item.cStock);
        const diferencia = stock - fisico;

        return {
          item,
          codigoLimpio,
          fisico,
          stock,
          diferencia,
          detalles
        };
      })
      // 📌 Filtramos por diferencia distinta de 0 Y que cReferencia exista y no esté en blanco
      .filter(p => p.diferencia !== 0 && p.item.cReferencia && String(p.item.cReferencia).trim() !== '')
      .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia));

    // ===== 3. Generar las filas del informe =====
    productosConDiferencia.forEach(p => {
      const { item, fisico, stock, diferencia, detalles } = p;

      const border = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      };

      const headerStyle = {
        font: { bold: true, color: { rgb: '000000' } },
        fill: { fgColor: { rgb: 'D9D9D9' } },
        border,
        alignment: { horizontal: 'left' }
      };

      const subHeaderStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'F2F2F2' } },
        border,
        alignment: { horizontal: 'center' }
      };

      const normalStyle = {
        border,
        alignment: { horizontal: 'left' }
      };

      const totalStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'BDD7EE' } },
        border,
        alignment: { horizontal: 'left' }
      };

      const totalStyle2 = {
        font: { bold: true },
        border,
        alignment: { horizontal: 'left' }
      };

      // Cabecera del producto
      rows.push([
        { v: `CodBarras: ${item.cCodigoBarra || ''}`, t: 's', s: headerStyle },
        { v: `Referencia: ${item.cReferencia || ''}`, t: 's', s: headerStyle },
        { v: `Descripcion: ${item.cDescripcion || ''}`, t: 's', s: headerStyle },
        { v: `Talla: ${item.cTalla || 'NA'}`, t: 's', s: headerStyle },
        { v: `Color: ${item.cColor || ''}`, t: 's', s: headerStyle },
        { v: `Stock: ${stock}`, t: 's', s: headerStyle },
        { v: `Diferencia: ${Math.abs(diferencia)}`, t: 's', s: headerStyle }
      ]);

      // Encabezado de columnas
      rows.push([
        { v: '', t: 's', s: '' },
        { v: 'Zona', t: 's', s: subHeaderStyle },
        { v: 'Subzona', t: 's', s: subHeaderStyle },
        { v: 'Unidades Contadas', t: 's', s: subHeaderStyle }
      ]);

      // Detalle (sin RECONTEO)
      detalles.forEach(d => {
        rows.push([
          { v: '', t: 's', s: '' },
          { v: d.ZONA || '', t: 's', s: normalStyle },
          { v: d.SUBZONA || '', t: 's', s: normalStyle },
          { v: toNumber(d.UNIDADES), t: 'n', s: { ...normalStyle, alignment: { horizontal: 'right' } } }
        ]);
      });

      // Totales
      rows.push([
        { v: '', t: 's', s: '' },
        { v: '', t: 's', s: '' },
        { v: 'TOTAL UNIDADES CONTADAS', t: 's', s: totalStyle2 },
        { v: fisico, t: 'n', s: { ...totalStyle2, alignment: { horizontal: 'right' } } }
      ]);

      rows.push([
        { v: '', t: 's', s: '' },
        { v: '', t: 's', s: '' },
        { v: 'DIFERENCIA - STOCK = DIFERENCIA VALIDADA', t: 's', s: totalStyle },
        { v: Math.abs(diferencia) - stock, t: 'n', s: { ...totalStyle, alignment: { horizontal: 'right' } } }
      ]);

      rows.push([]); // espacio entre productos
    });

    return rows;
  }

  private getInventoryExportRowsConteos(data: any[]) {
    return data.map(item => {
      // Acumulador con las categorías fijas
      const acumulador: { [key: string]: number } = {
        'Almacén': 0,
        'Venta': 0,
        'Tester': 0,
        'Reconteo': 0,
        'Defectuoso': 0,
        'Otros': 0
      };

      // Sumar las columnas del producto actual con la lógica indicada
      Object.keys(item).forEach(columna => {
        const valor = toNumber(item[columna]);
        if (!valor) return;

        const columnaLower = columna.toLowerCase();
        const inicial = columna.charAt(0).toUpperCase();

        if (columnaLower === 'tester') {
          acumulador['Tester'] += valor;
        } else if (columnaLower === 'reconteo') {
          acumulador['Reconteo'] += valor;
        } else if (columnaLower === 'otros') {
          acumulador['Otros'] += valor;
        } else if (columnaLower === 'ac') {
          acumulador['Venta'] += valor;
        } else if (columnaLower === 'defectuoso') {
          acumulador['Defectuoso'] += valor;
        } else if (inicial === 'A') {
          acumulador['Almacén'] += valor;
        } else if (['M', 'P', 'G'].includes(inicial)) {
          acumulador['Venta'] += valor;
        }
      });

      const stock = toNumber(item.cStock);
      const totalConteo = toNumber(item.cTotalConteo);
      const fisicos = stock + totalConteo;
      const diffin = stock - totalConteo;

      return {
        id: item.id,
        CODIGOBARRAS: item.cCodigoBarra,
        REFERENCIA: item.cReferencia,
        DESCRIPCION: item.cDescripcion,
        TALLA: item.cTalla,
        COLOR: item.cColor,
        CODIGOBARRAS2: item.cCodigoBarra2,
        CODIGOBARRAS3: item.cCodigoBarra3,
        DEPARTAMENTO: item.cDepartamento,
        SECCION: item.cSeccion,
        FAMILIA: item.cFamilia,
        SUBFAMILIA: item.cSubFamilia,
        STYLEDESCRIPTION: item.cStyleDesc,
        ESENCIA: item.cEsencia,
        STOCK: stock,
        cTotalConteo: item.cTotalConteo,

        ...acumulador,                // Almacén, Venta, Tester, Reconteo, Defectuoso, Otros

        FISICOS: fisicos,             // cStock + cTotalConteo
        cEstadoEscaneado: item.cEstadoEscaneado || '',
        RECONTEO: item.RECONTEO || item.cReconteo || '',
        DIFFIN: diffin                // cStock - cTotalConteo
      };
    });
  }

  private getInventoryExportRowsGeneral(data: any[]) {
    return data.map(item => {
      // Acumulador limpio por producto
      const acumulador: { [key: string]: number } = this.dataZonas.reduce((acc, z: any) => {
        acc[z.nombre_zona] = 0;
        return acc;
      }, {} as { [key: string]: number });

      // Sumar las columnas del producto actual
      Object.keys(item).forEach(columna => {
        const valor = toNumber(item[columna]);
        if (!valor) return;

        const columnaUpper = columna.toUpperCase();
        const columnRefer: any = this.zonasSub.find(
          (z: any) => z.nombre_seccion?.toUpperCase() === columnaUpper
        );

        if (columnRefer?.nombre_zona && acumulador.hasOwnProperty(columnRefer.nombre_zona)) {
          acumulador[columnRefer.nombre_zona] += valor;
        }
      });

      // ===== Cálculos nuevos =====
      const fisico = Object.values(acumulador).reduce((sum, val) => sum + val, 0);
      const diferencia = Math.abs(toNumber(item.cStock) - fisico); // siempre positivo
      const estado = diferencia === 0 ? 'CORRECTO' : 'SOBRANTE';

      return {
        id: item.id,
        CODIGOBARRAS: item.cCodigoBarra,
        REFERENCIA: item.cReferencia,
        DESCRIPCION: item.cDescripcion,
        TALLA: item.cTalla,
        COLOR: item.cColor,
        CODIGOBARRAS2: item.cCodigoBarra2,
        CODIGOBARRAS3: item.cCodigoBarra3,
        DEPARTAMENTO: item.cDepartamento,
        SECCION: item.cSeccion,
        FAMILIA: item.cFamilia,
        SUBFAMILIA: item.cSubFamilia,
        STYLEDESCRIPTION: item.cStyleDesc,
        ESENCIA: item.cEsencia,
        STOCK: item.cStock,

        ...acumulador,          // columnas de zonas

        FISICO: fisico,
        DIFERENCIA: diferencia,
        ESTADO: estado,
        RECONTEO: '',           // vacío
        FISFIN: fisico,
        DIFFIN: diferencia,
        ESTFIN: estado
      };
    });
  }


  private getInventoryExportRows(data: any[]) {
    return data.map(item => {
      return {
        id: item.id,
        cCodigoBarra: item.cCodigoBarra,
        cCodigoBarra2: item.cCodigoBarra2,
        cCodigoBarra3: item.cCodigoBarra3,
        cReferencia: item.cReferencia,
        cDescripcion: item.cDescripcion,
        cDepartamento: item.cDepartamento,
        cSeccion: item.cSeccion,
        cFamilia: item.cFamilia,
        cSubFamilia: item.cSubFamilia,
        cTalla: item.cTalla,
        cColor: item.cColor,
        cEsencia: item.cEsencia,
        cStyleDescription: item.cStyleDesc,
        cStock: item.cStock,
        cTotalConteo: inventoryDifference(item.cConteo, item.cStock),
        cConteo: item.cConteo,
        cEstadoEscaneo: toNumber(item.cConteo) == 0 ? 'NO ESCANEADO' : 'ESCANEADO',
      };
    });
  }

  private getSummaryRows(data: any[], noEscaneados: any[], diferencias: any[], stockNegativo: any[], skuDesconocido: any[]) {
    return [
      { Indicador: 'Total productos', Valor: data.length },
      { Indicador: 'Total stock', Valor: data.reduce((acc, item) => acc + toNumber(item.cStock), 0) },
      { Indicador: 'Total conteo', Valor: data.reduce((acc, item) => acc + toNumber(item.cConteo), 0) },
      { Indicador: 'Diferencia total', Valor: data.reduce((acc, item) => acc + toNumber(item.cTotalConteo), 0) },
      { Indicador: 'No escaneados', Valor: noEscaneados.length },
      { Indicador: 'Con diferencias', Valor: diferencias.length },
      { Indicador: 'Stock negativo', Valor: stockNegativo.length },
      { Indicador: 'SKU desconocido', Valor: skuDesconocido.length },
      { Indicador: 'Fecha reporte', Valor: new Date().toLocaleString() }
    ];
  }

  private appendSheet(workbook: XLSX.WorkBook, sheetName: string, data: any[]) {
    const worksheet = this.createWorksheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  private createWorksheet(data: any[]) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data.length ? data : [{}]);

    if (worksheet['!ref']) {
      worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(worksheet['!ref'])) };
    }

    return worksheet;
  }

  private paintNoScannedRows(worksheet: XLSX.WorkSheet) {
    if (!worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const estadoCellAddress = XLSX.utils.encode_cell({ r: R, c: 16 });
      const cell = worksheet[estadoCellAddress];

      if (cell && cell.v === 'NO ESCANEADO') {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[address]) continue;

          worksheet[address].s = {
            fill: { fgColor: { rgb: "FFFF0000" } },
            font: { color: { rgb: "FFFFFF" }, bold: true }
          };
        }
      }
    }
  }

  private isUnknownSku(item: any) {
    const hasProductCode = Boolean(item.cCodigoArticulo) && toNumber(item.cCodigoArticulo) !== 0;
    const hasDescription = Boolean(String(item.cReferencia || item.cDescripcion || '').trim());
    return !hasProductCode && !hasDescription;
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

  importExcelInventario(event: any) {
    this.onDataView = [];
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

      const formattedData = rawData.map(item => ({
        checking: 0,
        cCodigoArticulo: "",
        cCodigoBarra: item.cCodigoBarra,
        cCodigoBarra2: item.cCodigoBarra2,
        cCodigoBarra3: item.cCodigoBarra3,
        cReferencia: item.cReferencia,
        cDescripcion: item.cDescripcion,
        cDepartamento: item.cDepartamento,
        cSeccion: item.cSeccion,
        cFamilia: item.cFamilia,
        cSubFamilia: item.cSubFamilia,
        cTalla: item.cTalla,
        cColor: item.cColor,
        cEsencia: item.cEsencia,
        cStyleDescription: item.cStyleDesc,
        cStock: item.cStock,
        cTotalConteo: inventoryDifference(item.cConteo, item.cStock),
        cConteo: item.cConteo,
        cCodigoTienda: item.cCodigoTienda,
        cSessionCode: item.cSessionCode,
        codigo_sesion: item.codigo_sesion,
        cTemporada: "",
        id: item.id
      }));

      localStorage.setItem('offline_inventory', JSON.stringify(formattedData));
      this.onDataView = formattedData;
      this.initializeTable(formattedData);
    };

    reader.readAsArrayBuffer(file);
  }

  onChangeSelectStadistic(ev: any) {
    const acumulador: { [key: string]: number } = {};

    this.dataTable.forEach((item: any) => {
      const depto = item[ev.key] || 'Otros';
      const conteo = toNumber(item.cTotalConteo);

      if (acumulador[depto]) {
        acumulador[depto] += conteo;
      } else {
        acumulador[depto] = conteo;
      }
    });

    const etiquetas = Object.keys(acumulador).filter(key => acumulador[key] > 0);
    const valoresSumados = etiquetas.map(key => acumulador[key]);

    this.pieChartData = {
      labels: etiquetas,
      datasets: [{ data: valoresSumados, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
    };

    this.cdr.markForCheck();
  }

  onBarStadisctic(data2: any) {
    const acumulador: { [key: string]: number } = {
      'Almacén': 0,
      'Venta': 0,
      'Tester': 0,
      'Reconteo': 0,
      'Defectuoso': 0,
      'Otros': 0
    };

    this.dataTable.forEach((item: any) => {
      Object.keys(item).forEach(columna => {

        const valor = toNumber(item[columna]);
        const columnaLower = columna.toLowerCase();
        const inicial = columna.charAt(0).toUpperCase();

        if (columnaLower === 'tester') {
          acumulador['Tester'] += valor;
        } else if (columnaLower === 'reconteo') {
          acumulador['Reconteo'] += valor;
        } else if (columnaLower === 'otros') {
          acumulador['Otros'] += valor;
        } else if (columnaLower === 'ac') {
          acumulador['Venta'] += valor;
        } else if (columnaLower === 'defectuoso') {
          acumulador['Defectuoso'] += valor;
        } else if (inicial === 'A') {
          acumulador['Almacén'] += valor;
        } else if (['M', 'P', 'G'].includes(inicial)) {
          acumulador['Venta'] += valor;
        }
      });

      // console.log('📊 Datos para estadística de barras:',  acumulador);
    });

    const categoriasConDatos = Object.keys(acumulador).filter(key => acumulador[key] > 0);
    const etiquetasConValores = categoriasConDatos.map(key => `${key}: ${acumulador[key].toLocaleString()}`);
    const valoresSumados = categoriasConDatos.map(key => acumulador[key]);

    this.barChartData = {
      labels: etiquetasConValores,
      datasets: [{
        label: 'Distribucion stock por area',
        data: valoresSumados,
        backgroundColor: ['#36A2EB', '#4BC0C0', '#FF6384', '#FFCE56', '#9966FF']
      }]
    };

    this.cdr.markForCheck();
  }

  async onChangeReporte(data: any) {
    const selectData = data.key;
    this.tipoReporte = selectData;
    console.log('Reporte seleccionado:', selectData);
  }

  exportarReporte() {
    if (this.tipoReporte === 'aInterna') {
      this.exportarExcel();
    }

    if (this.tipoReporte === 'aGeneral') {
      this.exportarExcelGeneral();
    }
  }

  onZonaSub() {
    this.invService.getZonaVista().subscribe((zonas) => {
      this.zonasSub = zonas;
    });
  }

  onZonesList() {
    this.invService.getZonas().subscribe({
      next: (zonas) => {
        this.dataZonas = zonas;
      }
    });
  }
}
