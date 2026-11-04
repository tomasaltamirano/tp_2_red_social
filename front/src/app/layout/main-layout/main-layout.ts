import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { ThemeService } from '../../core/services/theme';

const MOBILE_BREAKPOINT = 900;
const SIDEBAR_KEY = 'profumi-sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  theme = inject(ThemeService);

  defaultAvatar = 'https://ui-avatars.com/api/?name=Profumi&background=8c5a32&color=fff';

  // En escritorio arranca abierta (o como la dejó el usuario); en mobile arranca cerrada.
  isSidebarOpen = signal(this.initialSidebarState());
  isMenuOpen = signal(false);

  private isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  private initialSidebarState() {
    if (this.isMobile()) return false;
    return localStorage.getItem(SIDEBAR_KEY) !== 'closed';
  }

  toggleSidebar() {
    this.isSidebarOpen.update((open) => !open);
    if (!this.isMobile()) {
      localStorage.setItem(SIDEBAR_KEY, this.isSidebarOpen() ? 'open' : 'closed');
    }
  }

  onNavClick() {
    if (this.isMobile()) this.isSidebarOpen.set(false);
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update((open) => !open);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeMenu() {
    this.isMenuOpen.set(false);
  }

  openExtendSession() {
    this.closeMenu();
    this.authService.openExtendSessionModal();
  }

  confirmExtendSession() {
    this.authService.refreshSession().subscribe();
  }

  logout() {
    this.closeMenu();
    this.authService.logout(true);
  }
}
