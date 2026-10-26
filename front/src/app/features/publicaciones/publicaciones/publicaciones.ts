import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.scss',
})
export class Publicaciones {
  postsDemo = [
    {
      autor: 'Valentina Rossi',
      username: '@valen_oud',
      avatar: 'https://ui-avatars.com/api/?name=Valentina+Rossi&background=7c7cff&color=fff',
      fecha: 'Hace 2 horas',
      titulo: 'Bleu de Chanel EDP — El rey de la versatilidad azul',
      mensaje:
        'Salida vibrante de pomelo y menta con un secado de incienso y cedro súper elegante. Ideal para oficina o salidas nocturnas en media estación.',
      notas: ['Pomelo', 'Incienso', 'Ámbar', 'Cedro'],
      likes: 28,
      comentarios: 6,
    },
    {
      autor: 'Julián Mercier',
      username: '@julian_niche',
      avatar: 'https://ui-avatars.com/api/?name=Julian+Mercier&background=1f9d6b&color=fff',
      fecha: 'Hace 5 horas',
      titulo: 'Comparativa fresca: Cítricos mediterráneos para el verano',
      mensaje:
        'Probando bergamota de Calabria y mandarina siciliana sobre piel. La fijación sorprende si aplicamos sobre piel hidratada.',
      notas: ['Bergamota', 'Mandarina', 'Neroli', 'Almizcle'],
      likes: 19,
      comentarios: 4,
    },
  ];
}