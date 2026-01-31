import { Component, ElementRef, QueryList, ViewChildren, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'mt-verification-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './mt-verification-modal.html',
  styleUrls: ['./mt-verification-modal.scss']
})
export class MtVerificationModal {
  @ViewChildren('inputBox') inputs!: QueryList<ElementRef>;
  code: string[] = ['', '', '', '', '', ''];
  isComplete = false;

  constructor(public dialogRef: MatDialogRef<MtVerificationModal>) { }

  onInput(event: any, index: number) {
    const val = event.target.value;
    if (val && index < 5) {
      this.inputs.toArray()[index + 1].nativeElement.focus();
    }
    this.checkCompletion();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    // Casteamos el target a HTMLInputElement
    const target = event.currentTarget as HTMLInputElement;

    if (event.key === 'Backspace' && !target.value && index > 0) {
      this.inputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const data = event.clipboardData?.getData('text') || '';
    const digits = data.split('');
    const inputElements = this.inputs.toArray();

    digits.forEach((char, index) => {
      if (inputElements[index]) {
        inputElements[index].nativeElement.value = char;
      }
    });

    const lastIndex = digits.length - 1;
    if (lastIndex >= 0) {
      inputElements[Math.min(lastIndex + 1, 5)].nativeElement.focus();
    }

    this.checkIfComplete();
  }

  checkIfComplete() {
    const code = this.inputs.toArray().map(el => el.nativeElement.value).join('');
    this.isComplete = code.length === 6;
  }

  checkCompletion() {
    const fullCode = this.inputs?.toArray().map(i => i.nativeElement.value).join('');
    this.isComplete = fullCode.length === 6;
  }

  onVerify() {
    const finalCode = this.inputs.toArray().map(i => i.nativeElement.value).join('');
    this.dialogRef.close(finalCode);
  }

  onCancel() { this.dialogRef.close(); }
}