import { Component, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonButton, IonCard, IonRow, IonCol
} from '@ionic/angular/standalone';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { MtNotificationModal } from '@metasperu/component/mt-notification-modal/mt-notification-modal';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog'; // Para mat-dialog-actions, title y content
import { MatButtonModule } from '@angular/material/button'; // Para los botones de acción
import { MatIconModule } from '@angular/material/icon';
import { StorageService } from '@metasperu/services/store.service';
import { InventoryService } from '@metasperu/services/inventory.service';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenu } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';

export interface PeriodicElement {
  codigo_sesion: string;
  nombre_tienda: string;
  usuario: string;
  fecha_inicio: string;
  estado: string;
}

export interface tableColumns {
  matColumnDef: string;
  titleColumn: string;
  propertyValue: string;
  filterActive?: boolean;
}

@Component({
  selector: 'app-inventory-session',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatTableModule, IonCol,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonRow, MatTooltipModule,
    IonToolbar, IonButton, MatSelectModule, MatPaginator, MatPaginatorModule, MatSortModule,
    IonCard, MtSelect, MtInput, MatMenu, MatMenuModule
  ],
  templateUrl: './inventory-session.html',
  styleUrl: './inventory-session.scss',
})
export default class InventorySession {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  sections = new FormControl('');
  storeName = '';
  generatedCode = signal<string | null>(null);
  isLoading = signal(false);
  stores: Array<any> = []; // Signal para la lista de tiendas
  selectedStoreId = ''; // Almacena el ID seleccionado
  displayedColumns: string[] = ['codigo_sesion', 'nombre_tienda', 'usuario', 'fecha_inicio', 'estado', 'accion'];
  dataColumns: tableColumns[] = [
    { matColumnDef: 'codigo_sesion', titleColumn: 'Codigo Sesion', propertyValue: 'codigo_sesion', filterActive: false },
    { matColumnDef: 'nombre_tienda', titleColumn: 'Tienda', propertyValue: 'nombre_tienda', filterActive: false },
    { matColumnDef: 'usuario', titleColumn: 'Creado por', propertyValue: 'usuario', filterActive: false },
    { matColumnDef: 'fecha_inicio', titleColumn: 'Fecha inicio', propertyValue: 'fecha_inicio', filterActive: false },
    { matColumnDef: 'estado', titleColumn: 'Estado', propertyValue: 'estado', filterActive: false },
    { matColumnDef: 'accion', titleColumn: 'Accion', propertyValue: '', filterActive: false }];
  filterValues: any = {};
  sessions: Array<any> = [];
  arSections: Array<any> = [];
  sectionsSelected: Array<any> = [];
  formSection: string[] = []
  inFilter: string = "";
  dataSource = new MatTableDataSource(this.sessions);
  roleUser: any = "";
  constructor(private dialog: MatDialog, private store: StorageService) { }

  ngOnInit() {
    this.getSections();
    this.loadStores();
    this.loeadSessions();
    const userRole = localStorage.getItem('role');
    this.roleUser = userRole;

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every(columnKey => {
        const cellValue = data[columnKey]?.toString().toLowerCase() || '';
        return cellValue.includes(searchTerms[columnKey]);
      });
    };
  }

  applyFilterTable(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;

    const property: any = this.dataColumns.find((t) => t.matColumnDef == column);
    const indexHeader: any = this.dataColumns.findIndex((t) => t.matColumnDef == column);
    this.dataColumns[indexHeader]['filterActive'] = filterValue.length ? true : false;
    this.filterValues[property?.propertyValue] = filterValue.trim().toLowerCase();

    this.dataSource.filter = JSON.stringify(this.filterValues);

    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every(columnKey => {
        const cellValue = data[columnKey]?.toString().toLowerCase() || '';
        return cellValue.includes(searchTerms[columnKey]);
      });
    };
  }

  showNotification() {
    this.dialog.open(MtNotificationModal, {
      width: '350px',
      panelClass: 'custom-notification-panel',
      data: {
        isSession: true,
        inCodeGen: this.generatedCode()
      }
    });
  }

  loadStores() {
    this.inventoryService.getStores().subscribe({
      next: (data) => {
        (data || []).filter((store) => {

          (this.stores || []).push({
            key: (store || {}).id, value: (store || {}).nombre_tienda, serie: (store || {}).serie
          });
        });
      },
      error: (err) => console.error('Error al cargar tiendas', err)
    });
  }

  loeadSessions() {
    this.inventoryService.getSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err) => console.error('Error al cargar tiendas', err)
    });
  }

  async onChangeSelect(data: any) {
    console.log(data);
    let selectData = data || {};
    this.selectedStoreId = (selectData || {}).key || "";
  }

  async onChangeSelectMultiple(data: any) {
    console.log(data);
    let selectData = data || {};
    selectData?.filter((selected: any) => {
      this.sectionsSelected.push({ seccion_id: selected?.key, nombre_seccion: selected?.value });
    });
  }

  async startInventory() {

    if (!this.selectedStoreId) return;

    this.isLoading.set(true);
    // Buscamos el nombre de la tienda basado en el ID para enviarlo al backend
    const store = this.stores.find(s => s.key === +this.selectedStoreId);
    const assignedSection = this.sectionsSelected;
    this.inventoryService.createSession(store!.key, assignedSection).subscribe({
      next: (res) => {
        this.generatedCode.set(res.session_code);
        this.store.setStore("codeSession", res.session_code);
        this.store.setStore("serieStore", store!.serie);
        this.isLoading.set(false);
        this.loeadSessions();
        this.showNotification();
      },
      error: (err) => { this.isLoading.set(false); }
    });
  }

  goToDashboard() {
    // Redirigir al monitor en vivo con el código recién creado
    this.router.navigate(['/inventory/dashboard', this.generatedCode()]);
  }

  applyFilter(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.inFilter = value ?? "";
    const filterValue = value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getSections() {
    this.inventoryService.getSections().subscribe({
      next: (data) => {
        (data || []).filter((sec) => {
          (this.arSections || []).push({
            key: (sec || {}).seccion_id, value: (sec || {}).nombre_seccion
          });
        });
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    })
  }


  onActiveSession(element: any) {
    this.inventoryService.putStartSession(element?.codigo_sesion).subscribe({
      next: (data) => {
        this.loeadSessions();
        this.onNotification({ message: data?.message });
      },
      error: (err) => {
        this.onNotification({ error: 'error', message: err?.message });
      }
    })
  }

  onNotification(result: any) {
    let notificationList = [{
      isSuccess: !result?.error?.length ? true : false,
      isError: result?.error?.length ? true : false,
      bodyNotification: result?.message
    }];

    this.inventoryService.onNotification.emit(notificationList);
  }

  async onNavigatorDashboard(element: any) {
    const store = this.stores.find(s => s.value === element?.nombre_tienda);

    if (!element?.codigo_sesion || !store!.serie) return;

    localStorage.removeItem('offline_inventory');
    this.store.setStore("codeSession", element?.codigo_sesion);
    this.store.setStore("serieStore", store!.serie);
    this.router.navigate([`/inventory/dashboard`, element?.codigo_sesion, store?.serie]);
  }

}
