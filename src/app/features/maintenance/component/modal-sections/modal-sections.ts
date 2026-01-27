import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MtInput } from '@metasperu/component/mt-input/mt-input';

@Component({
  selector: 'modal-sections',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MtInput],
  templateUrl: './modal-sections.html',
  styleUrl: './modal-sections.scss',
})
export class ModalSections {
  constructor(
    public dialogRef: MatDialogRef<ModalSections>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onChangeInput(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.data.nombre_seccion = value ?? "";
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
