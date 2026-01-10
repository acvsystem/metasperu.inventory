import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog'; // Para mat-dialog-actions, title y content
import { MatButtonModule } from '@angular/material/button'; // Para los botones de acción
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mt-notification-modal',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './mt-notification-modal.html',
  styleUrl: './mt-notification-modal.scss',
})
export class MtNotificationModal {

  @Input() inTitle: string = "";
  @Input() inTextContent: string = "";
  @Input() isSession: boolean = false;
  @Input() inCodeGen: string = "";

  constructor(
    public dialogRef: MatDialogRef<MtNotificationModal>,
    @Inject(MAT_DIALOG_DATA) public data: any // Aquí se reciben los parámetros
  ) {
    this.isSession = this.data.isSession;
    this.inCodeGen = this.data.inCodeGen;
  }


  close(): void {
    this.dialogRef.close();
  }

}
