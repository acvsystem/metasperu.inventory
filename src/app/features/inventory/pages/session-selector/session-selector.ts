import { Component, OnInit, inject, signal } from '@angular/core';
import { InventoryService } from '../../../../shared/services/inventory.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonBadge, IonItem,
  IonLabel, IonButton, IonList, IonTitle,
  IonToolbar, IonHeader
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-session-selector',
  standalone: true,
  imports: [CommonModule, IonContent, IonList, IonItem, IonLabel, IonButton, IonBadge, IonTitle, IonToolbar, IonHeader],
  templateUrl: './session-selector.html',
  styleUrl: './session-selector.scss',
})
export default class SessionSelector {
  private invService = inject(InventoryService);
  private router = inject(Router);
  activeSessions = signal<any[]>([]);

  ngOnInit() {
    this.invService.getActiveSessions().subscribe(data => this.activeSessions.set(data));
  }

  selectSession(code: string) {
    this.router.navigate(['/inventory/dashboard', code]);
  }
}
