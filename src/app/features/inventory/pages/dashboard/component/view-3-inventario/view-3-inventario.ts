import { Component, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MtDatatable } from '@metasperu/component/mt-datatable/mt-datatable';
import * as XLSX from 'xlsx';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'view-3-inventario',
  imports: [IonRow, IonCol, MtSelect, CommonModule, MtDatatable, MatIconModule, MatPaginatorModule],
  templateUrl: './view-3-inventario.html',
  styleUrl: './view-3-inventario.scss',
})
export class View3Inventario {
  @Input() onDataView: Array<any> = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  cbo_1: string = "";
  cbo_2: string = "";
  dataParse: any = {};
  dataIn: Array<any> = [];
  displayedColumns = [
    'codigoBarra',
    'referencia',
    'descripcion',
    'departamento',
    'seccion',
    'familia',
    'subfamilia',
    'temporada',
    'talla',
    'color',
    'stock'];

  dataProcess: Array<any> = [];

  cboArea: Array<any> = [
    { key: 'Almacén', value: 'Almacén', isDefault: true },
    { key: 'Venta', value: 'Venta' },
    { key: 'Tester', value: 'Tester' },
    { key: 'Reconteo', value: 'Reconteo' },
    { key: 'Otros', value: 'Otros' }
  ];

  cboArea_2: Array<any> = [
    { key: 'Almacén', value: 'Almacén' },
    { key: 'Venta', value: 'Venta' },
    { key: 'Tester', value: 'Tester' },
    { key: 'Reconteo', value: 'Reconteo' },
    { key: 'Otros', value: 'Otros' }
  ];

  dataColumns: tableColumns[] = [
    { isSticky: true, matColumnDef: 'codigoBarra', titleColumn: 'Codigo Barra', propertyValue: 'cCodigoBarra', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'referencia', titleColumn: 'Referencia', propertyValue: 'cReferencia', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'descripcion', titleColumn: 'Descripcion', propertyValue: 'cDescripcion', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'departamento', titleColumn: 'Departamento', propertyValue: 'cDepartamento', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'seccion', titleColumn: 'Seccion', propertyValue: 'cSeccion', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'familia', titleColumn: 'Familia', propertyValue: 'cFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'subfamilia', titleColumn: 'SubFamilia', propertyValue: 'cSubFamilia', filterActive: false, isCboFilter: true, cboFilter: [] },
    { isSticky: false, matColumnDef: 'temporada', titleColumn: 'Temporada', propertyValue: 'cTemporada', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'talla', titleColumn: 'Talla', propertyValue: 'cTalla', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'color', titleColumn: 'Color', propertyValue: 'cColor', filterActive: false, isCboFilter: false, cboFilter: [] },
    { isSticky: false, matColumnDef: 'stock', titleColumn: 'Stock', propertyValue: 'cStock', filterActive: false, isCboFilter: false, cboFilter: [] }];


  constructor(private invService: InventoryService) {

  }

  ngAfterViewInit() {

  }

  ngOnInit() {
    
   this.dataIn = JSON.parse(localStorage.getItem('all_inventory') || '[]');
   this.onFilterDiffArea();
    /*this.invService.onInventoryArea.subscribe((data) => {
      console.log('Data received in View3Inventario from InventoryService:', data);
      if (data.length) {
        this.dataIn = data || [];
        this.onFilterDiffArea();
      }
    });*/
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['onDataView'] && changes['onDataView'].currentValue) {
      console.log('onDataView changed in View3Inventario:', changes['onDataView'].currentValue);
      this.dataIn = this.onDataView || [];
      this.onFilterDiffArea();
    }
  }


  onValidarItem(sku: string, data: any, columna: string) {
    const values = data[columna];
    return values instanceof Set ? !values.has(sku) : values.findIndex((d: any) => d == sku) == -1;
  }

  obtenerCodigosFaltantes(dataA: Array<any>, dataB: Array<any>) {
    // Creamos un Set de la listaB para búsquedas de alta velocidad O(1)
    const setB = new Set(dataB);

    // Filtramos listaA: "Dame los items que NO están en setB"
    return dataA.filter(codigo => !setB.has(codigo));
  }

  onFilterDiffArea() {
    const data = this.dataIn;

    // 1. Inicializamos el acumulador con las categorías deseadas
    const acumulador: { [key: string]: any } = {
      'Almacén': [],
      'Venta': new Set(),
      'Tester': new Set(),
      'Reconteo': new Set(),
      'Defectuoso': new Set(),
      'Otros': new Set()
    };

    data.forEach((item: any) => {
      // Recorremos todas las propiedades (columnas) de cada objeto
      Object.keys(item).forEach(columna => {
        const valor = Number(item[columna]) || 0;
        const columnaLower = columna.toLowerCase();
        const inicial = columna.charAt(0).toUpperCase();

        // 2. Lógica de clasificación por nombre exacto o nomenclatura
        if (columnaLower === 'tester') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Tester')) {
            acumulador['Tester'].add(item.cCodigoBarra);
          }
        } else if (columnaLower === 'reconteo') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Reconteo')) {
            acumulador['Reconteo'].add(item.cCodigoBarra);
          }
        } else if (columnaLower === 'otros') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Otros')) {
            acumulador['Otros'].add(item.cCodigoBarra);
          }
        } else if (columnaLower === 'ac') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Venta')) {
            acumulador['Venta'].add(item.cCodigoBarra);
          }
        } else if (columnaLower === 'defectuoso') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Defectuoso')) {
            acumulador['Defectuoso'].add(item.cCodigoBarra);
          }
        } else if (inicial === 'A') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Almacén')) {
            acumulador['Almacén'].push(item.cCodigoBarra);
          }
        } else if (['M', 'P', 'G'].includes(inicial)) {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Venta')) {
            acumulador['Venta'].add(item.cCodigoBarra);
          }
        }
      });
    });

    this.dataParse = Object.fromEntries(
      Object.entries(acumulador).map(([key, value]) => [key, Array.from(value)])
    );

    console.log('Data parsed for View3Inventario:', this.dataParse);
  }

  onProcessDiff() {
    const diferencia = this.obtenerCodigosFaltantes(this.dataParse[this.cbo_1], this.dataParse[this.cbo_2]);
    if (diferencia.length) {
      const diferenciaSet = new Set(diferencia);
      const dataTable = this.dataIn.filter((d) => diferenciaSet.has(d.cCodigoBarra));

      this.dataProcess = dataTable;
      console.log(this.dataProcess);
    }
  }

  async onChangeSelect(data: any) {
    const selectData = data.value;
    if (data.id == 'cbo1') {
      this.cbo_1 = selectData || "";
    }

    if (data.id == 'cbo2') {
      this.cbo_2 = selectData || "";
    }
  }

  exportarExcel() {
    // 1. Mapeamos los datos (Tu lógica se mantiene igual)
    const dataParaExportar = this.dataProcess.map(item => {
      const objReturn: Record<string, any> = {
        cCodigoTienda: item.cCodigoTienda,
        cCodigoArticulo: item.cCodigoArticulo,
        cCodigoBarra: item.cCodigoBarra,
        cReferencia: item.cReferencia,
        cDescripcion: item.cDescripcion,
        cDepartamento: item.cDepartamento,
        cSeccion: item.cSeccion,
        cFamilia: item.cFamilia,
        cSubFamilia: item.cSubFamilia,
        cTemporada: item.cTemporada,
        cTalla: item.cTalla,
        cColor: item.cColor,
        cStock: item.cStock
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
    this.saveAsExcelFile(excelBuffer, 'inventario_sin_exponer');
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

export interface tableColumns {
  isSticky: boolean;
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive: boolean;
  isCboFilter: boolean;
  cboFilter: Array<any>;
}
