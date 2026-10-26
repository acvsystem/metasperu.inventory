import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'mt-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './mt-input.html',
  styleUrl: './mt-input.scss',
})
export class MtInput {
  @Input() id: string = 'mt-input-' + Math.floor(Math.random() * 9999 + 1111);
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() autoText: string = '';
  @Input() type: string = 'text';
  @Output() afterChange: EventEmitter<any> = new EventEmitter();

  onChange(ev: any) {
    const self = this;
    let value = (ev.target.value || '').trim();
    this.afterChange.emit({ id: self.id, value: value });
  }

  onlyNumbers(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);

    // Si la tecla presionada no coincide con el patrón de números, cancelamos el evento
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onChangeNumber(ev: any) {
    this.autoText = this.autoText.replace(/[^0-9]/g, '');
    const self = this;
    let value = (ev.target.value || '').trim();
    this.afterChange.emit({ id: self.id, value: value });
  }
}
