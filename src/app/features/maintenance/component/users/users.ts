import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModalUsers } from '../modal-users/modal-users';
import { UserService } from '@metasperu/services/users.service'
import { InventoryService } from '@metasperu/services/inventory.service';

@Component({
  selector: 'app-users',
  imports: [MatIconModule, MatButtonModule, MatTableModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  displayedColumns: string[] = ['id', 'usuario', 'profile_name', 'rol', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  constructor(public dialog: MatDialog, private serviceUser: UserService, private service: InventoryService) { }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    // Simulación de carga desde API

    this.serviceUser.getUsers().subscribe((users) => {
      this.dataSource.data = users;
    });
  }

  // --- MÉTODO AGREGAR ---
  agregarUsuario() {
    const dialogRef = this.dialog.open(ModalUsers, {
      width: '350px',
      data: { username: '', password: '', perfilname: '', role: '', title: 'Agregar Usuario' } // Objeto vacío para nueva sección
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        if (result) {

          this.serviceUser.postUser(result).subscribe((users) => {
            this.dataSource.data = users;
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
  eliminarUsuario(user: any) {
    if (confirm(`¿Estás seguro de eliminar la sección "${user.usuario}"?`)) {

      this.serviceUser.delUser(user.id).subscribe({
        next: (result) => {
          this.dataSource.data = this.dataSource.data.filter(s => s.id !== user.id);
          this.onNotification(result);
        },
        error: (err) => {
          this.onNotification({ error: 'error', message: err?.message });
        }
      });
    }
  }

  editarUsuario(user: any) {
    const dialogRef = this.dialog.open(ModalUsers, {
      width: '350px',
      data: { ...user, title: 'Editar Sección' }
    });

    dialogRef.afterClosed().subscribe({

      next: (result) => {
        console.log(result);
        if (result) {
          const index = this.dataSource.data.findIndex(s => s.id === user.id);
          if (index !== -1) {
            const actualizados = [...this.dataSource.data];
            actualizados[index] = result;
            this.serviceUser.putUser(actualizados[index]).subscribe((result) => {
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
