import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'notaOlfativa', standalone: true })
export class NotaOlfativaPipe implements PipeTransform {
  transform(nota: string): string {
    const n = nota.toLowerCase();
    if (/(bergamota|lim[oó]n|mandarina|pomelo|naranja|c[ií]trico)/.test(n)) return `🍋 ${nota}`;
    if (/(cedro|s[aá]ndalo|oud|vetiver|madera|pino|pachuli)/.test(n)) return `🪵 ${nota}`;
    if (/(vainilla|tonka|caramelo|miel|chocolate|[aá]mbar)/.test(n)) return `🍯 ${nota}`;
    if (/(rosa|jazm[ií]n|iris|lavanda|neroli|flor|violeta)/.test(n)) return `🌸 ${nota}`;
    if (/(pimienta|cardamomo|canela|especia|cuero|tabaco)/.test(n)) return `🔥 ${nota}`;
    return `💧 ${nota}`;
  }
}
