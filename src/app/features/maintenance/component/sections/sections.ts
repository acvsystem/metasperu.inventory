import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModalSections } from '../modal-sections/modal-sections';
import { InventoryService } from '@metasperu/services/inventory.service';
@Component({
  selector: 'app-sections',
  imports: [MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './sections.html',
  styleUrl: './sections.scss',
})
export class Sections {
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(public dialog: MatDialog, private service: InventoryService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Simulación de carga desde API

    this.service.getSections().subscribe((sections) => {
      this.dataSource.data = sections;
    });
  }

  // --- MÉTODO AGREGAR ---
  agregarSeccion() {
    const dialogRef = this.dialog.open(ModalSections, {
      width: '350px',
      data: { nombre_seccion: '', title: 'Agregar Sección' } // Objeto vacío para nueva sección
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.nombre_seccion) {

        this.service.postSections(result.nombre_seccion.toUpperCase()).subscribe((rs) => {
          console.log(rs);
        });

        const nuevaSeccion = {
          id: Math.random(), // El ID lo suele generar el servidor
          nombre_seccion: result.nombre_seccion.toUpperCase()
        };

        this.dataSource.data = [...this.dataSource.data, nuevaSeccion];
      }
    });
  }

  // --- MÉTODO ELIMINAR ---
  eliminarSeccion(seccion: any) {
    if (confirm(`¿Estás seguro de eliminar la sección "${seccion.nombre_seccion}"?`)) {
      // 1. Llamar a API para borrar
      console.log('Eliminando ID:', seccion.id);

      // 2. Filtrar el array localmente para quitar el elemento
      this.dataSource.data = this.dataSource.data.filter(s => s.id !== seccion.id);
    }
  }

  editarSeccion(seccion: any) {
    const dialogRef = this.dialog.open(ModalSections, {
      width: '350px',
      data: { ...seccion, title: 'Editar Sección' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.dataSource.data.findIndex(s => s.id === seccion.id);
        if (index !== -1) {
          const actualizados = [...this.dataSource.data];
          actualizados[index].nombre_seccion = result.nombre_seccion.toUpperCase();
          this.dataSource.data = actualizados;
        }
      }
    });
  }
}
