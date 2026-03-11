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
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ModalReport } from './component/modal-report/modal-report';
import { MtDatatable } from '@metasperu/component/mt-datatable/mt-datatable';

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
  imports: [MtDatatable, MatTableModule, MatTooltipModule, BaseChartDirective, MatSidenavModule, MatCheckboxModule, MtSelect, IonCardContent, IonGrid, IonCard, MatBadgeModule, MatMenuModule, IonIcon, MatFormFieldModule, MatPaginatorModule, MatIconModule, MatSortModule, IonCol, IonRow, CommonModule],
  templateUrl: './view-2-inventario.html',
  styleUrl: './view-2-inventario.scss',
})
export class View2Inventario implements OnInit, OnChanges, AfterViewInit {
  @Input() onDataView: Array<any> = [];
  @Input() pocketScan: any = null; // Objeto que llega del Socket: { cCodigoBarra: '...' }
  @Input() inAsignatedSections: Array<any> = [];
  @Input() isReporte: boolean = false;
  @Output() onChangeInventario: EventEmitter<any> = new EventEmitter();
  isInsertColum: boolean = false;
  dataSource = new MatTableDataSource<any>([]);
  dataTable: Array<any> = [];
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
  // Configuración del gráfico de Torta (Secciones)
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  displayedColumns: Array<string> = [
    'checking', 'codigoBarra', 'Referencia', 'descripcion', 'departamento',
    'seccion', 'familia', 'subfamilia', 'temporada',
    'talla', 'color', 'stock', 'total',
  ];

  extraColumns: Array<string> = [];

  // Configuración del gráfico de Barras (Usuarios)
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
    { isSticky: false, matColumnDef: 'temporada', titleColumn: 'Temporada', propertyValue: 'cTemporada', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'color_scent', titleColumn: 'Color/Scent', propertyValue: 'cColorScent', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'total', titleColumn: 'Total Conteo', propertyValue: 'cTotalConteo', filterActive: false, isCboFilter: false, cboFilter: [{ key: 'Positivo', value: 'Positivo' }, { key: 'Negativo', value: 'Negativo' }, { key: 'cero sin escaneo', value: 'cero sin escaneo' }, { key: 'cero escaneo', value: 'cero escaneo' }] }];

  constructor(private dialog: MatDialog, private cdr: ChangeDetectorRef, private invService: InventoryService) {

  }

  ngAfterViewInit() {

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

    // this.extraColumns = this.inAsignatedSections.map((s) => s.nombre_seccion);

  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['onDataView'] && changes['onDataView'].currentValue) {
      this.initializeTable(changes['onDataView'].currentValue);
    }

    if (changes['pocketScan'] && changes['pocketScan'].currentValue) {
      this.updateSingleRecord(this.pocketScan);
    }

    if (changes['inAsignatedSections'] && changes['inAsignatedSections'].currentValue) {
      this.extraColumns = this.inAsignatedSections.map((s) => s.nombre_seccion);
      this.asignSectionColum();
    }
  }

  asignSectionColum() {
    if (!this.isInsertColum) {
      this.inAsignatedSections.map((section, i) => {
        this.dataColumns.push({ isSticky: false, matColumnDef: (section.nombre_seccion).toLowerCase(), titleColumn: section.nombre_seccion, propertyValue: `${((section.nombre_seccion)).replace(" ", "_").toLowerCase()}`, filterActive: false, isCboFilter: false, cboFilter: [] });
        this.displayedColumns.push((section.nombre_seccion).toLowerCase());
      });

      this.isInsertColum = true;
    }
  }
  onChangeInv() {
    this.onChangeInventario.emit();
  }

  openVerification() {
    const dialogRef = this.dialog.open(ModalReport, {
      width: '420px',
      panelClass: 'custom-notification-panel',
      data: this.dataSource.data
    });

    dialogRef.afterClosed().subscribe(rs => {
    });
  }



  processDataFilter(currentData: any) {
    // Calculamos los totales usando reduce
    const totales = currentData.reduce((acc: any, curr: any) => {
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

    this.dataTable = data;
    this.invService.onInventoryArea.emit(data);
    this.onBarStadisctic(data);
    this.cdr.markForCheck();

  }


  exportarExcel() {
    // 1. Mapeamos los datos (Tu lógica se mantiene igual)
    const dataParaExportar = this.dataTable.map(item => {
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
      await this.initializeTable(formattedData);
    };

    reader.readAsArrayBuffer(file);
  }



  onChangeSelectStadistic(ev: any) {
    const data = this.dataSource.data;

    // 1. Crear un objeto para acumular las sumas
    // Ejemplo: { 'GIFT SETS': 50, 'BEAUTY': 30 }
    const acumulador: { [key: string]: number } = {};

    data.forEach((item: any) => {
      const depto = item[ev.key] || 'Otros';
      const conteo = Number(item.cTotalConteo) || 0;

      // Sumamos el conteo al departamento correspondiente
      if (acumulador[depto]) {
        acumulador[depto] += conteo;
      } else {
        acumulador[depto] = conteo;
      }
    });

    // 2. Extraer solo los departamentos que tienen una suma mayor a 0
    const etiquetas = Object.keys(acumulador).filter(key => acumulador[key] > 0);
    const valoresSumados = etiquetas.map(key => acumulador[key]);

    // 3. Actualizar el objeto que lee el HTML
    // Mantenemos la referencia de 'pieChartData' para evitar el bucle infinito
    this.pieChartData = {
      labels: etiquetas,
      datasets: [{ data: valoresSumados, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
    };

    // 4. Refrescar la vista
    this.cdr.markForCheck();

  }

  onBarStadisctic(data2: any) {

    if (!this.barChartData.datasets?.[0].data.length) {
      const data = this.dataSource.data;

      // 1. Inicializamos el acumulador con las categorías deseadas
      const acumulador: { [key: string]: number } = {
        'Almacén': 0,
        'Venta': 0,
        'Tester': 0,
        'Reconteo': 0,
        'Otros': 0
      };

      data.forEach((item: any) => {
        // Recorremos todas las propiedades (columnas) de cada objeto
        Object.keys(item).forEach(columna => {
          const valor = Number(item[columna]) || 0;
          const columnaLower = columna.toLowerCase();
          const inicial = columna.charAt(0).toUpperCase();

          // 2. Lógica de clasificación por nombre exacto o nomenclatura
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

      // 1. Filtrar solo las categorías que tienen stock
      const categoriasConDatos = Object.keys(acumulador).filter(key => acumulador[key] > 0);

      // 2. Crear etiquetas que incluyan el nombre y el valor total
      // Usamos .toLocaleString() para que ponga puntos de miles (ej: 1.250)
      const etiquetasConValores = categoriasConDatos.map(key => {
        return `${key}: ${acumulador[key].toLocaleString()}`;
      });

      // 3. Extraer solo los números para el gráfico
      const valoresSumados = categoriasConDatos.map(key => acumulador[key]);
      console.log(valoresSumados);
      // 4. Actualizamos el gráfico con una paleta de colores extendida
      this.barChartData = {
        labels: etiquetasConValores,
        datasets: [{
          label: 'Distribucion stock por area',
          data: valoresSumados,
          backgroundColor: [
            '#36A2EB', // Almacén (Azul)
            '#4BC0C0', // Venta (Verde)
            '#FF6384', // Tester (Rosa)
            '#FFCE56', // Reconteo (Amarillo)
            '#9966FF'  // Otros (Morado)
          ]
        }]
      };

      this.cdr.markForCheck();
    }

  }


}