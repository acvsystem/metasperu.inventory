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

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result && result.nombre_seccion) {

          this.service.postSections(result.nombre_seccion.toUpperCase()).subscribe((rs) => {
            const nuevaSeccion = {
              id: Math.random(), // El ID lo suele generar el servidor
              nombre_seccion: result.nombre_seccion.toUpperCase()
            };

            this.dataSource.data = [...this.dataSource.data, nuevaSeccion];
            this.onNotification(result);
          });
        }
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  // --- MÉTODO ELIMINAR ---
  eliminarSeccion(seccion: any) {
    if (confirm(`¿Estás seguro de eliminar la sección "${seccion.nombre_seccion}"?`)) {

      this.service.delSections(seccion.seccion_id).subscribe({
        next: (result) => {
          this.dataSource.data = this.dataSource.data.filter(s => s.seccion_id !== seccion.seccion_id);
          this.onNotification(result);
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
        }
      });
    }
  }

  editarSeccion(seccion: any) {
    const dialogRef = this.dialog.open(ModalSections, {
      width: '350px',
      data: { ...seccion, title: 'Editar Sección' }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {
          const index = this.dataSource.data.findIndex(s => s.seccion_id === seccion.seccion_id);
          if (index !== -1) {
            const actualizados = [...this.dataSource.data];
            actualizados[index].nombre_seccion = result.nombre_seccion.toUpperCase();
            this.service.putSections(actualizados[index].seccion_id, actualizados[index].nombre_seccion).subscribe((result) => {
              this.dataSource.data = actualizados;
              this.onNotification(result);
            });
          }
        }
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length ? true : false,
      isError: result?.error?.length ? true : false,
      bodyNotification: result?.message
    }];

    this.service.onNotification.emit(notificationList);
  }
}
