import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'modal-subzona-range',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatRadioModule],
  templateUrl: './modal-subzona-range.html',
  styleUrl: './modal-subzona-range.scss',
})
export class ModalSubzonaRange {
  error = '';

  constructor(
    public dialogRef: MatDialogRef<ModalSubzonaRange>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.data.mode = this.data.mode || 'single';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.error = '';

    if (this.data.mode === 'single') {
      const name = (this.data.nombre_seccion || '').trim().toUpperCase();
      if (!name) {
        this.error = 'Ingrese el nombre de la subzona.';
        return;
      }
      this.dialogRef.close({ mode: 'single', nombre_seccion: name });
      return;
    }

    const prefix = (this.data.prefix || '').trim().toUpperCase();
    const start = Number(this.data.start);
    const end = Number(this.data.end);

    if (!/^[A-Z]+$/.test(prefix)) {
      this.error = 'Ingrese una letra válida para el rango.';
      return;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0 || start > end) {
      this.error = 'Ingrese un rango numérico válido.';
      return;
    }

    this.dialogRef.close({ mode: 'range', prefix, start, end });
  }
}
