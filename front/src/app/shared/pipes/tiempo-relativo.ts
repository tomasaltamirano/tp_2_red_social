import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tiempoRelativo', standalone: true })
export class TiempoRelativoPipe implements PipeTransform {
  private rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' });

  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const seg = Math.round((new Date(valor).getTime() - Date.now()) / 1000);
    const abs = Math.abs(seg);

    if (abs < 60) return 'hace instantes';
    if (abs < 3600) return this.rtf.format(Math.round(seg / 60), 'minute');
    if (abs < 86400) return this.rtf.format(Math.round(seg / 3600), 'hour');
    if (abs < 2592000) return this.rtf.format(Math.round(seg / 86400), 'day');
    return this.rtf.format(Math.round(seg / 2592000), 'month');
  }
}
