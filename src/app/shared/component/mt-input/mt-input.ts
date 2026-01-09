import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCol, IonRow } from '@ionic/angular/standalone';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'mt-input',
  imports: [
    FormsModule, CommonModule, IonCol, IonRow, MatInputModule, MatFormFieldModule
  ],
  templateUrl: './mt-input.html',
  styleUrl: './mt-input.scss',
})
export class MtInput {

}
