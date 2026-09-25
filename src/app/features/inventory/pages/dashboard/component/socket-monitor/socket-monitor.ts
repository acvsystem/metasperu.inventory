import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { InventorySocketService } from '@metasperu/services/inventory-socket.service';

@Component({
  selector: 'app-socket-monitor',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './socket-monitor.html',
  styleUrl: './socket-monitor.scss'
})
export class SocketMonitor implements OnInit, OnDestroy {
  private socketService = inject(InventorySocketService);
  private subscription?: Subscription;
  stats: any = null;

  ngOnInit() {
    this.subscription = this.socketService.socketMonitor$.subscribe(stats => this.stats = stats);
    this.socketService.subscribeSocketMonitor();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  percent(value: number, max: number) {
    if (!max) return 0;
    return Math.max(4, Math.min(100, value * 100 / max));
  }

  maxEventCount() {
    return Math.max(1, ...(this.stats?.events || []).map((event: any) => Number(event.count || 0)));
  }

  formatUptime(seconds: any) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }
}
