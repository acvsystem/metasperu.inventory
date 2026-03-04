import { Component, inject, Input, ViewChild } from '@angular/core';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
@Component({
  selector: 'view-3-inventario',
  imports: [IonRow, IonCol, MtSelect, MatPaginator, MatPaginatorModule, MatTableModule],
  templateUrl: './view-3-inventario.html',
  styleUrl: './view-3-inventario.scss',
})
export class View3Inventario {
  @Input() dataIn: Array<any> = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  cbo_1: string = "";
  cbo_2: string = "";
  dataParse: any = {};
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

  dataSource = new MatTableDataSource<any>;

  cboArea: Array<any> = [
    { key: 'Almacén', value: 'Almacén' },
    { key: 'Venta', value: 'Venta' },
    { key: 'Tester', value: 'Tester' },
    { key: 'Reconteo', value: 'Reconteo' },
    { key: 'Otros', value: 'Otros' }
  ];

  constructor(private invService: InventoryService) {

  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnInit() {
    this.invService.onInventoryArea.subscribe((data) => {
      if (data.length) {
        this.dataIn = data || [];
        this.onFilterDiffArea();
      }
    });
  }

  onValidarItem(sku: string, data: any, columna: string) {
    const valid = data[columna].findIndex((d: any) => d == sku);
    return valid == -1 ? true : false;
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
    const acumulador: { [key: string]: Array<any> } = {
      'Almacén': [],
      'Venta': [],
      'Tester': [],
      'Reconteo': [],
      'Otros': []
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
            acumulador['Tester'].push(item.cCodigoBarra);
          }
        } else if (columnaLower === 'reconteo') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Reconteo')) {
            acumulador['Reconteo'].push(item.cCodigoBarra);
          }
        } else if (columnaLower === 'otros') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Otros')) {
            acumulador['Otros'].push(item.cCodigoBarra);
          }
        } else if (columnaLower === 'ac') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Venta')) {
            acumulador['Venta'].push(item.cCodigoBarra);
          }
        } else if (columnaLower === 'defectuoso') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Defectuoso')) {
            acumulador['Defectuoso'].push(item.cCodigoBarra);
          }
        } else if (inicial === 'A') {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Almacén')) {
            acumulador['Almacén'].push(item.cCodigoBarra);
          }
        } else if (['M', 'P', 'G'].includes(inicial)) {
          if (this.onValidarItem(item.cCodigoBarra, acumulador, 'Venta')) {
            acumulador['Venta'].push(item.cCodigoBarra);
          }
        }
      });
    });

    this.dataParse = acumulador;
  }

  onProcessDiff() {
    const diferencia = this.obtenerCodigosFaltantes(this.dataParse[this.cbo_1], this.dataParse[this.cbo_2]);
    if (diferencia.length) {
      const dataTable = this.dataIn.filter((d) => {
        if (diferencia.includes(d.cCodigoBarra)) {
          return d;
        }
      });

      this.dataSource.data = dataTable;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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
}
