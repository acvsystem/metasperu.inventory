import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
  selector: 'mt-loader',
  imports: [],
  templateUrl: './mt-loader.html',
  styleUrl: './mt-loader.scss',
})
export class MtLoader {

  @Input() title: string = 'Procesando...';


  ngOnChanges(changes: SimpleChanges) {
    // 1. Cambio en los datos de las filas
    if (changes['title'] && this.title) {
      this.title = this.title;
    }
  }

}
