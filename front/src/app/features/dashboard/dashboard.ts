import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="dash-head">
      <h1>Panel de Administración</h1>
      <p>Gestioná las cuentas de la comunidad Profumi y analizá las métricas de actividad.</p>
    </header>

    <nav class="dash-tabs" aria-label="Secciones del panel">
      <a routerLink="estadisticas" routerLinkActive="active">
        <i class="ph ph-chart-line-up"></i>
        <span>Estadísticas</span>
      </a>
      <a routerLink="usuarios" routerLinkActive="active">
        <i class="ph ph-users-three"></i>
        <span>Usuarios</span>
      </a>
    </nav>

    <router-outlet />
  `,
  styles: `
    .dash-head {
      margin-bottom: 1.25rem;
      h1 {
        margin: 0;
        font-family: 'Cormorant Garamond', serif;
        font-size: 2.1rem;
        color: var(--text);
      }
      p {
        margin: 0.3rem 0 0;
        color: var(--text-muted);
        font-size: 0.92rem;
      }
    }
    .dash-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      a {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1rem;
        margin-bottom: -1px;
        border-bottom: 2px solid transparent;
        color: var(--text-muted);
        font-size: 0.92rem;
        font-weight: 500;
        text-decoration: none;
        &:hover {
          color: var(--text);
        }
        &.active {
          color: var(--text);
          font-weight: 600;
          border-bottom-color: var(--accent-amber);
          i {
            color: var(--accent-amber);
          }
        }
      }
    }
  `,
})
export class Dashboard {}
