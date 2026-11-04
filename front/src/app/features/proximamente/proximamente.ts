import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-proximamente',
  standalone: true,
  template: `
    <section class="soon">
      <div class="soon-icon"><i class="ph" [class]="'ph ' + icono"></i></div>
      <h2>{{ titulo }}</h2>
      <p>{{ texto }}</p>
    </section>
  `,
  styles: `
    .soon {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-muted);
    }
    .soon-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.8rem;
      background: var(--primary-soft);
      color: var(--accent-amber);
    }
    h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      margin: 0 0 0.5rem;
      color: var(--text);
    }
    p {
      margin: 0;
      font-size: 0.95rem;
    }
  `,
})
export class Proximamente {
  private data = inject(ActivatedRoute).snapshot.data;
  titulo: string = this.data['titulo'] ?? 'Próximamente';
  icono: string = this.data['icono'] ?? 'ph-hourglass-medium';
  texto: string = this.data['texto'] ?? 'Esta sección todavía está en construcción.';
}
