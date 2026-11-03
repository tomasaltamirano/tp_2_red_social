import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  titulo = 'Profumi — Comunidad de Perfumería';

  defaultAvatar = 'https://ui-avatars.com/api/?name=Profumi&background=8c5a32&color=fff';

  isExpanded = signal(false);

  toggleSidebar() {
    this.isExpanded.update((val) => !val);
  }

  toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  }

  confirmExtendSession() {
    this.authService.refreshSession().subscribe();
  }

  logout() {
    this.authService.logout(true);
  }
}
