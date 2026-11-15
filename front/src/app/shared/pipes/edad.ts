import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'edad', standalone: true })
export class EdadPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const nacimiento = new Date(valor);
    if (isNaN(nacimiento.getTime())) return '';

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getUTCFullYear();
    const noCumplio =
      hoy.getMonth() < nacimiento.getUTCMonth() ||
      (hoy.getMonth() === nacimiento.getUTCMonth() && hoy.getDate() < nacimiento.getUTCDate());

    if (noCumplio) edad--;
    return edad >= 0 ? `${edad} ${edad === 1 ? 'año' : 'años'}` : '';
  }
}
