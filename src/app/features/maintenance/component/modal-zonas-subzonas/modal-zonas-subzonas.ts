import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ModalSections } from '../modal-sections/modal-sections';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'modal-zonas-subzonas',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule],
  templateUrl: './modal-zonas-subzonas.html',
  styleUrl: './modal-zonas-subzonas.scss',
})
export class ModalZonasSubzonas {
  zonas: any[] = [];
  selectedZona: any = null;
  constructor(
    public dialogRef: MatDialogRef<ModalSections>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.zonas = this.data?.zonas || [];
    console.log('Datos recibidos en el modal:', this.data);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onZonaChange(): void {
    const selectedZona = (this.selectedZona || '').toUpperCase().trim();
    this.data.newZone = selectedZona;
  }
}
