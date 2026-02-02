import { Component, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { MtSelect } from '@metasperu/component/mt-select/mt-select';
import { IonCol, IonRow } from '@ionic/angular/standalone';
import { MatRadioModule } from '@angular/material/radio';



@Component({
  selector: 'app-modal-store',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MtInput, IonCol, IonRow, MatRadioModule],
  templateUrl: './modal-store.html',
  styleUrl: './modal-store.scss',
})
export class ModalStore {

  constructor(
    public dialogRef: MatDialogRef<ModalStore>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {

  }

  onChangeInput(input_id: string, data: any) {
    if (!data) return;
    const { id, value } = data;
    if (input_id == 'serie') {
      this.data.serie = value;
    }
    if (input_id == 'nombre_tienda') {
      this.data.nombre_tienda = value;
    }

  }

  onNoClick(): void {
    this.dialogRef.close();
  }


}
