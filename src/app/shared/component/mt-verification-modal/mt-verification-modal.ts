import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'mt-verification-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './mt-verification-modal.html',
  styleUrls: ['./mt-verification-modal.scss']
})
export class MtVerificationModal {
  @ViewChildren('inputBox') inputs!: QueryList<ElementRef<HTMLInputElement>>;
  code: string[] = ['', '', '', '', '', ''];
  isComplete = false;

  constructor(public dialogRef: MatDialogRef<MtVerificationModal>) { }

  get filledCount() { return this.code.filter(Boolean).length; }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const inserted = (event as InputEvent).data;
    const singleCharacter = (event as InputEvent).inputType === 'insertText' && inserted?.length === 1;
    const text = (singleCharacter ? inserted : input.value).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (text.length > 1) {
      this.fillCode(text, text.length >= 6 ? 0 : index);
      input.value = this.code[index];
    }
    else {
      this.code[index] = text;
      input.value = text;
      this.checkCompletion();
      if (text && index < 5) this.focusAt(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.code[index] && index > 0) {
      event.preventDefault();
      this.code[index - 1] = '';
      this.checkCompletion();
      this.focusAt(index - 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusAt(Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1))));
    }
  }

  onPaste(event: ClipboardEvent, index = 0) {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (text) this.fillCode(text, text.length >= 6 ? 0 : index);
  }

  private fillCode(text: string, start: number) {
    for (let i = start; i < 6; i++) this.code[i] = text[i - start] || '';
    this.checkCompletion();
    this.focusAt(Math.min(5, start + text.length));
  }

  private focusAt(index: number) {
    const input = this.inputs?.get(index)?.nativeElement;
    input?.focus();
    input?.select();
  }

  checkCompletion() {
    this.isComplete = this.code.every(character => /^[A-Z0-9]$/.test(character));
  }

  onVerify() {
    if (this.isComplete) this.dialogRef.close(this.code.join(''));
  }

  onCancel() { this.dialogRef.close(); }
}
