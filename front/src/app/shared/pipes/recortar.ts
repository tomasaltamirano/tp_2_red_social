import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'recortar', standalone: true })
export class RecortarPipe implements PipeTransform {
  transform(texto: string | null | undefined, max = 35): string {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max).trimEnd() + '…' : texto;
  }
}
