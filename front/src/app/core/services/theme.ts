import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'profumi-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    // Por defecto claro; si el usuario eligió oscuro antes, se recuerda.
    this.apply(localStorage.getItem(STORAGE_KEY) === 'dark');
  }

  toggle() {
    this.apply(!this.isDark());
  }

  private apply(dark: boolean) {
    this.isDark.set(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  }
}
