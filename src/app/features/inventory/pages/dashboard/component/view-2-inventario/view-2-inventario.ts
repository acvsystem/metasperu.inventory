import { Component, Input, SimpleChanges, OnInit, OnChanges, AfterViewInit, ChangeDetectorRef, signal, EventEmitter, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';
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

const toNumber = (value: any) => {
  const numericValue = typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const numberValue = Number(numericValue);
  return Number.isFinite(numberValue) ? numberValue : 0;
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
  @Input() isReporte: boolean = false;
  @Output() onChangeInventario: EventEmitter<any> = new EventEmitter();

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
    'checking', 'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia',
    'talla', 'color', 'Esencia', 'style_description', 'stock', 'total', 'conteo',
  ];

  extraColumns: Array<string> = [];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { title: { display: true, text: 'Cantidades por Usuario' } }
  };

  cboStadictics: Array<any> = [{ key: 'cDepartamento', value: 'Departamento' }, { key: 'cSeccion', value: 'Seccion' }, { key: 'cFamilia', value: 'Familia' }, { key: 'cSubFamilia', value: 'SubFamilia' }];

  dataColumns: tableColumns[] = [
    { isSticky: true, matColumnDef: 'checking', titleColumn: 'Revisado', propertyValue: 'checking', filterActive: false, isCboFilter: false, cboFilter: [{ key: 1, value: 'Revisado' }, { key: 0, value: 'Sin Revisar' }] },
    { isSticky: true, matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'Referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'Esencia', titleColumn: 'Esencia', propertyValue: 'cEsencia', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'style_description', titleColumn: 'Style Description', propertyValue: 'cStyleDescription', filterActive: false, isCboFilter: false, cboFilter: [] },
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
      console.log('📦 Inventario recibido Importado:', this.onDataView);
    }
    if (this.onDataView?.length) {
      console.log('📦 Inventario recibido Importado:', this.onDataView);
      this.scheduleInitializeTable(this.onDataView);
    } else {
      this.isLoading = false;
    }
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
    this.onChangeInventario.emit();
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
        sumaDiferencia: acc.sumaDiferencia + (conteo - stock)
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

      if (item.cCodigoBarra === '667559097457') {
        console.log('🔍 SKU Especial Encontrado:', item);
      }

      totalStockGlobal += stock;
      totalConteoGlobal += conteo;

      return {
        ...item,
        cStock: stock,
        cConteo: conteo,
        cTotalConteo: conteo - stock
      };
    });

    this.totalStock.set(totalStockGlobal);
    this.totalConteo.set(totalConteoGlobal);
    this.totalDiferencia.set(totalConteoGlobal - totalStockGlobal);

    this.progress.set(1);
    this.isProcessing.set(false);
    this.showTable.set(true);

    if (this.pocketScan) {
      this.updateSingleRecord(this.pocketScan);
    } else {
      this.asignSectionColum();
    }

    this.cdr.markForCheck();
  }

  private updateSingleRecord(pocketScans: any[]) {
    if (!pocketScans) return;
    this.proccessScan(pocketScans);
  }

  proccessScan(dataPocket: Array<any>) {
    const data = [...this.dataTable];
    const dataMap = new Map(data.map((item, index) => [item.cCodigoBarra, { item, index }]));
    const agrupado = new Map<string, any>();
    const totalesPorSku = new Map<string, number>();

    dataPocket.forEach(item => {
      const key = `${item.sku}-${item.seccion_id}`;
      const cantidad = toNumber(item.total_cantidad);

      if (!agrupado.has(key)) {
        agrupado.set(key, { ...item, total_cantidad: cantidad });
      } else {
        agrupado.get(key).total_cantidad += cantidad;
      }

      totalesPorSku.set(item.sku, (totalesPorSku.get(item.sku) || 0) + cantidad);
    });

    const seccionesMap = new Map(this.inAsignatedSections.map(s => [
      s.id,
      sectionColumnKey(s.nombre_seccion)
    ]));

    agrupado.forEach((scan) => {
      const skuTotal = totalesPorSku.get(scan.sku) || 0;
      const sectionProp = seccionesMap.get(scan.seccion_id);
      const existing = dataMap.get(scan.sku);

      if (existing) {
        const { index } = existing;
        if (sectionProp) {
          data[index][sectionProp] = scan.total_cantidad;
        }
        data[index].cConteo = skuTotal;
        data[index].cTotalConteo = toNumber(data[index].cConteo) - toNumber(data[index].cStock);
      } else {
        const newItem: any = {
          cCodigoArticulo: 0,
          cCodigoBarra: scan.sku,
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
        dataMap.set(scan.sku, { item: newItem, index: data.length - 1 });
      }
    });

    const sumaTotalScaneada = data.reduce((acc, item) => acc + toNumber(item.cConteo), 0);
    const sumaStock = data.reduce((acc, item) => acc + toNumber(item.cStock), 0);

    this.totalConteo.set(sumaTotalScaneada);
    this.totalStock.set(sumaStock);
    this.totalDiferencia.set(sumaTotalScaneada - sumaStock);

    this.dataTable = data;
    this.asignSectionColum();
    this.invService.onInventoryArea.emit(data);
    this.onBarStadisctic(data);
    this.cdr.markForCheck();
  }

  exportarExcel() {
    const dataParaExportar = this.dataTable.map(item => {
      return {
        id: item.id,
        cCodigoBarra: item.cCodigoBarra,
        cReferencia: item.cReferencia,
        cDescripcion: item.cDescripcion,
        cDepartamento: item.cDepartamento,
        cSeccion: item.cSeccion,
        cFamilia: item.cFamilia,
        cSubFamilia: item.cSubFamilia,
        cTalla: item.cTalla,
        cColor: item.cColor,
        cEsencia: item.cEsencia,
        cStyleDescription: item.cStyleDescription,
        cStock: item.cStock,
        cTotalConteo: toNumber(item.cConteo) - toNumber(item.cStock),
        cConteo: item.cConteo,
        cEstadoEscaneo: toNumber(item.cConteo) == 0 ? 'NO ESCANEADO' : 'ESCANEADO',
      };
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataParaExportar);
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

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
        cReferencia: item.cReferencia,
        cDescripcion: item.cDescripcion,
        cDepartamento: item.cDepartamento,
        cSeccion: item.cSeccion,
        cFamilia: item.cFamilia,
        cSubFamilia: item.cSubFamilia,
        cTalla: item.cTalla,
        cColor: item.cColor,
        cEsencia: item.cEsencia,
        cStyleDescription: item.cStyleDescription,
        cStock: item.cStock,
        cTotalConteo: toNumber(item.cConteo) - toNumber(item.cStock),
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
}
