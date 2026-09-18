import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MtInput } from '@metasperu/component/mt-input/mt-input';
import { ModalSections } from '../modal-sections/modal-sections';

export interface Zona {
  zona_id: number | null;
  nombre_zona: string | null;
}

@Component({
  selector: 'app-modal-zonas',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, MtInput],
  templateUrl: './modal-zonas.html',
  styleUrl: './modal-zonas.scss',
})
export class ModalZonas {
  constructor(
    public dialogRef: MatDialogRef<ModalZonas>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onChangeInput(data: any) {
    if (!data) return;
    const { id, value } = data;
    this.data.nombre_zona = value ?? "";
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}