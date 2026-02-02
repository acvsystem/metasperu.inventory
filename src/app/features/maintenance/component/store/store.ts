import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModalUsers } from '../modal-users/modal-users';
import { StoreService } from '@metasperu/services/stores.service'
import { InventoryService } from '@metasperu/services/inventory.service';
import { ModalStore } from '../modal-store/modal-store';

@Component({
  selector: 'app-store',
  imports: [MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './store.html',
  styleUrl: './store.scss',
})
export class Store {
  displayedColumns: string[] = ['id', 'serie', 'nombre_tienda', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(public dialog: MatDialog, private serviceStore: StoreService, private service: InventoryService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Simulación de carga desde API

    this.serviceStore.getStore().subscribe((store) => {
      this.dataSource.data = store;
    });
  }

  // --- MÉTODO AGREGAR ---
  agregarStore() {
    const dialogRef = this.dialog.open(ModalStore, {
      width: '350px',
      data: { serie: '', nombre_tienda: '' } // Objeto vacío para nueva sección
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {

          this.serviceStore.postStore(result).subscribe((store) => {
            this.dataSource.data = store?.data;
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
  eliminarStore(store: any) {
    if (confirm(`¿Estás seguro de eliminar la sección "${store.nombre_tienda}"?`)) {

      this.serviceStore.delStore(store.id).subscribe({
        next: (result) => {
          this.dataSource.data = this.dataSource.data.filter(s => s.id !== store.id);
          this.onNotification(result);
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
        }
      });
    }
  }

  editarStore(store: any) {
    const dialogRef = this.dialog.open(ModalStore, {
      width: '350px',
      data: { ...store, title: 'Editar Sección' }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {
          const index = this.dataSource.data.findIndex(s => s.id === store.id);
          if (index !== -1) {
            const actualizados = [...this.dataSource.data];
            actualizados[index] = result;
            this.serviceStore.putStore(actualizados[index]).subscribe((result) => {
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
