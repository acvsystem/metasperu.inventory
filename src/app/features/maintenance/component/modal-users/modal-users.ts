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
  selector: 'app-modal-users',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MtInput, IonCol, IonRow, MatRadioModule],
  templateUrl: './modal-users.html',
  styleUrl: './modal-users.scss',
})
export class ModalUsers {


  arRole: Array<any> = [{ key: 'administrador', value: 'administrador' }, { key: 'auditor', value: 'auditor' }, { key: 'pocket', value: 'pocket' }];
  userRol: string = "";
  constructor(
    public dialogRef: MatDialogRef<ModalUsers>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {


    if (!this.userRol) {

      this.userRol = this.data.role;

    } else {
      this.data.role = this.userRol;
    }

  }

  onChangeInput(input_id: string, data: any) {
    if (!data) return;
    const { id, value } = data;
    if (input_id == 'username') {
      this.data.username = value;
    }
    if (input_id == 'password') {
      this.data.password = value;
    }
    if (input_id == 'perfilname') {
      this.data.perfilname = value
    }

  }

  onRolChange() {
    this.data.role = this.userRol.toLowerCase();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
