import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'modal-asignar-subzonas-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatRadioModule],
  templateUrl: './modal-asignar-subzonas-sesion.html',
  styleUrl: './modal-asignar-subzonas-sesion.scss',
})
export class ModalAsignarSubzonasSesion {
  error = '';

  constructor(
    public dialogRef: MatDialogRef<ModalAsignarSubzonasSesion>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.data.mode = this.data.mode || 'range';
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.error = '';
    const sessionCode = (this.data.session_code || '').trim().toUpperCase();

    if (!sessionCode) {
      this.error = 'Ingrese el código de sesión.';
      return;
    }

    if (this.data.mode === 'single') {
      const name = (this.data.nombre_seccion || '').trim().toUpperCase();
      if (!name) {
        this.error = 'Ingrese la subzona.';
        return;
      }
      this.dialogRef.close({ mode: 'single', session_code: sessionCode, nombre_seccion: name });
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

    this.dialogRef.close({ mode: 'range', session_code: sessionCode, prefix, start, end });
  }
}
