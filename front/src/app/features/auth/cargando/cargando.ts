import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-cargando',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="loading-screen">
      <div class="loading-box">
        <img src="/logo-profumi.svg" alt="Profumi" class="loading-logo" />
        <div class="spinner" aria-hidden="true"></div>
        <h2>Verificando tu sesión...</h2>
        <p>Preparando tu colección olfativa</p>
      </div>
    </section>
  `,
  styles: `
    .loading-screen {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: var(--bg);
      padding: 1.5rem;
    }

    .loading-box {
      text-align: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 2.75rem 2.25rem;
      max-width: 360px;
      width: 100%;
      box-shadow: var(--shadow);
    }

    .loading-logo {
      height: 52px;
      width: auto;
      margin: 0 auto 1.5rem;
      display: block;
    }

    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 1.25rem;
      border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--accent-amber, var(--primary));
      animation: spin 0.8s linear infinite;
    }

    h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.65rem;
      margin: 0 0 0.35rem;
      color: var(--text);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Cargando implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const minDelay = 1200; // 1.2 segundos
    const start = Date.now();

    this.authService.authorizeSession().subscribe({
      next: () => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => {
          this.router.navigate(['/publicaciones'], { replaceUrl: true });
        }, remaining);
      },
      error: () => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minDelay - elapsed);
        setTimeout(() => {
          this.authService.logout(false);
          this.router.navigate(['/login'], { replaceUrl: true });
        }, remaining);
      },
    });
  }
}
