import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppUpdateService } from '../../../../shared/services/app-update.service';
import { db } from '../../../../core/db/offline-db';

@Component({
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './updates.html',
  styleUrl: './updates.scss',
})
export default class Updates implements OnInit {
  readonly updates = inject(AppUpdateService);
  readonly pending = signal<number | null>(null);
  readonly storageError = signal(false);
  private readonly requestedReturn = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl') || '';
  readonly backUrl = /^\/inventory\/(pocket|session|maintenance|dashboard\/[^?#]+)$/.test(this.requestedReturn)
    ? this.requestedReturn : '/inventory/pocket';
  async ngOnInit() {
    this.updates.dismissNotice();
    try { this.pending.set(await db.scans.where('synced').equals(0).count()); }
    catch { this.storageError.set(true); }
  }
}
