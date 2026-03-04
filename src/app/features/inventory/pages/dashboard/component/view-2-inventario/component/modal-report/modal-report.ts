import { Component, inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IonRow, IonCol, IonIcon, IonCardContent, IonCard, IonGrid } from '@ionic/angular/standalone';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';

@Component({
  selector: 'app-modal-report',
  imports: [IonRow, IonCol, MtSelect],
  templateUrl: './modal-report.html',
  styleUrl: './modal-report.scss',
})
export class ModalReport {

  readonly dataSource = inject<any>(MAT_DIALOG_DATA);
  dataParse: any = {};
  cboArea: Array<any> = [
    { key: 'Almacén', value: 'Almacén' },
    { key: 'Venta', value: 'Venta' },
    { key: 'Tester', value: 'Tester' },
    { key: 'Reconteo', value: 'Reconteo' },
    { key: 'Otros', value: 'Otros' }
  ];

  ngOnInit() {
    if (this.dataSource.length) {
      this.onFilterDiffArea();
    }
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
    const data = this.dataSource;

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
    this.obtenerCodigosFaltantes(this.dataParse, this.dataParse);
  }

  async onChangeSelect(data: any) {
    const selectData = data.value;
    console.log(selectData);
  }
}

