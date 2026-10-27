import { AuthService } from '../../core/auth/auth.service';
import { Component, inject } from '@angular/core';
import { Sections } from './component/sections/sections';
import { Users } from './component/users/users';
import { Store } from './component/store/store';
import { MatTabsModule } from '@angular/material/tabs';
import {
  IonContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-maintenance',
  imports: [Sections, MatTabsModule, IonContent, Users, Store],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export default class Maintenance {
  readonly auth = inject(AuthService);
  get roleUser() { return this.auth.user()?.role || ''; }
}
