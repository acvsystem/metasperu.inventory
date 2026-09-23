import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ModalSections } from '../modal-sections/modal-sections';
import { InventoryService } from '@metasperu/services/inventory.service';
import { ModalZonas } from '../modal-zonas/modal-zonas';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ModalZonasSubzonas } from '../modal-zonas-subzonas/modal-zonas-subzonas';
import { ModalSubzonaRange } from '../modal-subzona-range/modal-subzona-range';
import { ModalAsignarSubzonasSesion } from '../modal-asignar-subzonas-sesion/modal-asignar-subzonas-sesion';
@Component({
  selector: 'app-sections',
  imports: [MatIconModule, MatButtonModule, MatTableModule, MatButtonToggleModule, MatPaginatorModule],
  templateUrl: './sections.html',
  styleUrl: './sections.scss',
})
export class Sections implements AfterViewInit {
  @ViewChild('paginatorVista') paginatorVista!: MatPaginator;
  @ViewChild('paginatorZonas') paginatorZonas!: MatPaginator;
  @ViewChild('paginatorSubzonas') paginatorSubzonas!: MatPaginator;

  displayedColumns: string[] = ['id', 'zona', 'subzona', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  displayedColumnsZonas: string[] = ['id', 'zona', 'acciones'];
  dataSourceZonas = new MatTableDataSource<any>([]);

  displayedColumnsSubzonas: string[] = ['id', 'subzona', 'acciones'];
  dataSourceSubzonas = new MatTableDataSource<any>([]);

  dataZonas: any[] = [];
  isVista: boolean = true;
  isZonas: boolean = false;
  isSubzonas: boolean = false;
  pageSizeOptions = [10, 20, 50, 100];
  constructor(public dialog: MatDialog, private service: InventoryService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    this.bindPaginators();
  }

  private bindPaginators() {
    if (this.paginatorVista) this.dataSource.paginator = this.paginatorVista;
    if (this.paginatorZonas) this.dataSourceZonas.paginator = this.paginatorZonas;
    if (this.paginatorSubzonas) this.dataSourceSubzonas.paginator = this.paginatorSubzonas;
  }

  cambiarVista(vista: string) {
    console.log('Vista seleccionada:', vista);
    this.isVista = vista === 'vista';
    this.isZonas = vista === 'zonas';
    this.isSubzonas = vista === 'subzonas';
    this.onZonaSub();
    this.onZonesList();
    this.onSubZonaList();
  }

  cargarDatos() {
    // Simulación de carga desde API
    this.onZonaSub();
    this.onZonesList();
    this.onSubZonaList();
  }

  onZonaSub() {
    this.service.getZonaVista().subscribe((zonas) => {
      this.dataSource.data = [];
      this.dataSource.data = zonas;
      this.bindPaginators();
    });
  }

  onSubZonaList() {
    this.service.getSubzonas().subscribe((subzonas) => {
      this.dataSourceSubzonas.data = subzonas;
      this.bindPaginators();
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

  agregarZona() {
    const dialogRef = this.dialog.open(ModalZonas, {
      width: '350px',
      data: { nombre_zona: '', title: 'Agregar Zona' }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        const nombreZona = result?.nombre_zona?.trim()?.toUpperCase();
        if (!nombreZona) return;

        this.service.postZonas(nombreZona).subscribe({
          next: (rs) => {
            this.onZonesList();
            this.onNotification(rs);
          },
          error: (err) => {
            this.onNotification({ error: 'error', message: err?.message });
          }
        });
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  agregarSubzona() {
    const dialogRef = this.dialog.open(ModalSubzonaRange, {
      width: '430px',
      data: { title: 'Agregar Subzona', mode: 'single' }
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;

        this.service.postSectionsBulk(result).subscribe({
          next: (rs) => {
            this.onSubZonaList();
            this.onZonaSub();
            this.onNotification(rs);
          },
          error: (err) => {
            this.onNotification({ error: 'error', message: err?.message });
          }
        });
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  asignarSubzonasSesion() {
    const dialogRef = this.dialog.open(ModalAsignarSubzonasSesion, {
      width: '460px',
      data: { title: 'Asignar Subzonas a Sesión', mode: 'range' }
    });

    dialogRef.afterClosed().subscribe({
      next: (result) => {
        if (!result) return;

        this.service.assignSectionsToSessionBulk(result).subscribe({
          next: (rs) => {
            this.onZonaSub();
            this.onNotification(rs);
          },
          error: (err) => {
            this.onNotification({ error: 'error', message: err?.message });
          }
        });
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

  onZonesList() {
    this.service.getZonas().subscribe({
      next: (zonas) => {
        this.dataZonas = zonas;
        this.dataSourceZonas.data = zonas;
        this.bindPaginators();
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }


  editarZS(grupo: any) {
    const dialogRef = this.dialog.open(ModalZonasSubzonas, {
      width: '350px',
      data: { ...grupo, title: 'Editar Zona/Subzona', zonas: this.dataZonas }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {
          console.log('Resultado del modal de edición de Zona/Subzona:', result);
          if (result.newZone && result.seccion_id) {
            this.onUdpZonaSubzona(result.zona_escaneo_id, parseInt(result.newZone), result.seccion_id);
          }
        }
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }


  onUdpZonaSubzona(zona_escaneo_id: number, zona_id: number, seccion_id: number) {
    this.service.putZonaSubzona(zona_escaneo_id, zona_id, seccion_id).subscribe({
      next: (result) => {
        this.onNotification(result);
        this.onZonaSub();
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  editarZona(zona: any) {
    const dialogRef = this.dialog.open(ModalZonas, {
      width: '350px',
      data: { ...zona, title: 'Editar Zona' }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {
          const nombreZona = result?.nombre_zona?.trim()?.toUpperCase();
          if (!nombreZona) return;

          this.service.putZonas(zona.zona_id, nombreZona).subscribe({
            next: (rs) => {
              this.onZonesList();
              this.onZonaSub();
              this.onNotification(rs);
            },
            error: (err) => {
              this.onNotification({ error: 'error', message: err?.message });
            }
          });
        }
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    });
  }

  eliminarZona(zona: any) {
    if (confirm(`¿Estás seguro de eliminar la zona "${zona.nombre_zona}"?`)) {

      this.service.delZonas(zona.zona_id).subscribe({
        next: (result) => {
          this.dataSourceZonas.data = this.dataSourceZonas.data.filter(z => z.zona_id !== zona.zona_id);
          this.onNotification(result);
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
        }
      });
    }
  }
}
