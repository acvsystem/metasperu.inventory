import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCol, IonRow } from '@ionic/angular/standalone';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { InventoryService } from '@metasperu/services/inventory.service';
@Component({
  selector: 'toas-notification',
  imports: [FormsModule, CommonModule, IonCol, IonRow, MatInputModule, MatFormFieldModule],
  templateUrl: './toas-notification.html',
  styleUrl: './toas-notification.scss',
})
export class ToasNotification {
  configurationList: any = [];
  isSuccess: boolean = false;
  isError: boolean = false;
  isCaution: boolean = false;
  isInformation: boolean = false;
  bodyNotification: string = "";
  isTimeClose: boolean = false;

  constructor(private service: InventoryService) { }

  ngOnInit() {
    this.service.onNotification.subscribe((configuration) => {
      console.log(configuration);
      this.configurationList = [];
      this.isTimeClose = false;
      this.configurationList = configuration;
      setTimeout(() => {
        this.isTimeClose = true;
      }, 3000);
    });
  }


}
