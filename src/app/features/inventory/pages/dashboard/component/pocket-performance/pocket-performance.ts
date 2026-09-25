import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { InventoryService } from '@metasperu/services/inventory.service';

@Component({
  selector: 'app-pocket-performance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatTableModule, MatTooltipModule
  ],
  templateUrl: './pocket-performance.html',
  styleUrl: './pocket-performance.scss'
})
export class PocketPerformance implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  users: any[] = [];
  sections = new MatTableDataSource<any>([]);
  selectedUserId: number | null = null;
  loading = false;
  error = '';
  inactivitySeconds = 300;
  userColumns = ['user', 'scans', 'units', 'sections', 'elapsed', 'active', 'rate'];
  sectionColumns = ['section', 'scans', 'units', 'first', 'last', 'elapsed', 'active'];
  private request?: Subscription;

  constructor(
    private inventoryService: InventoryService,
    @Inject(MAT_DIALOG_DATA) public data: { sessionCode: string }
  ) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.request?.unsubscribe();
  }

  load(userId: number | null = this.selectedUserId) {
    if (!this.data.sessionCode) return;
    this.loading = true;
    this.error = '';
    this.request?.unsubscribe();
    this.request = this.inventoryService.getPocketPerformance(this.data.sessionCode, userId).subscribe({
      next: (result) => {
        this.users = result.users || [];
        this.selectedUserId = result.selectedUserId ?? (this.users[0]?.user_id ?? null);
        this.inactivitySeconds = result.inactivitySeconds || 300;
        this.sections.data = result.sections || [];
        setTimeout(() => this.sections.paginator = this.paginator || null);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'No se pudo cargar el rendimiento.';
        this.loading = false;
      }
    });
  }

  onSelectUser(value: any) {
    const userId = Number(value);
    this.selectedUserId = Number.isFinite(userId) && userId > 0 ? userId : null;
    this.load(this.selectedUserId);
  }

  userRate(user: any) {
    const elapsed = Number(user.elapsed_seconds || 0);
    if (elapsed <= 0) return '--';
    return (Number(user.scans || 0) * 3600 / elapsed).toFixed(1);
  }

  formatDuration(seconds: any) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  selectedUserName() {
    return this.users.find(user => Number(user.user_id) === Number(this.selectedUserId))?.username || 'Pocket';
  }
}
