import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/enviroment';

export interface UserProfile {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: 'usuario' | 'administrador';
  activo?: boolean;
  createdAt?: string;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  access_token: string;
}

export interface AuthorizeResponse {
  valid: boolean;
  user: UserProfile;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/auth`;

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  private statusPollTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  // Avisa cuando faltan 20 segundos para que venza el token
  private readonly WARNING_BEFORE_EXPIRY_MS = 20 * 1000;

  currentUser = signal<UserProfile | null>(this.loadStoredUser());
  showSessionModal = signal<boolean>(false);
  showDisabledModal = signal<boolean>(false);
  sessionSecondsLeft = signal<number>(20);
  isRefreshing = signal<boolean>(false);
  sessionValidated = signal<boolean>(false);

  constructor() {
    if (this.getToken()) {
      this.startSessionTimer();
    }
  }

  private loadStoredUser(): UserProfile | null {
    const raw = localStorage.getItem('profumi_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('profumi_token');
  }

  register(formData: FormData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/registro`, formData)
      .pipe(tap((res) => this.setSession(res.user, res.access_token)));
  }

  login(data: LoginData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap((res) => this.setSession(res.user, res.access_token)));
  }

  authorizeSession(): Observable<AuthorizeResponse> {
    return this.http.post<AuthorizeResponse>(`${this.apiUrl}/autorizar`, {}).pipe(
      tap((res) => {
        if (res.valid && res.user) {
          localStorage.setItem('profumi_user', JSON.stringify(res.user));
          this.sessionValidated.set(true);
          this.currentUser.set(res.user);
          this.startSessionTimer();
        }
      }),
    );
  }

  refreshSession(): Observable<AuthResponse> {
    this.isRefreshing.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/refrescar`, {}).pipe(
      tap({
        next: (res) => {
          this.closeExtendSessionModal();
          this.setSession(res.user, res.access_token);
          this.isRefreshing.set(false);
        },
        error: () => {
          this.isRefreshing.set(false);
          this.logout(true);
        },
      }),
    );
  }

  updateProfile(formData: FormData): Observable<{ message: string; user: UserProfile }> {
    const baseUrl = environment.apiUrl.replace(/\/$/, '');
    return this.http
      .put<{ message: string; user: UserProfile }>(`${baseUrl}/usuarios/perfil`, formData)
      .pipe(
        tap((res) => {
          localStorage.setItem('profumi_user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }),
      );
  }

  openExtendSessionModal() {
    this.startCountdown();
    this.showSessionModal.set(true);
  }

  closeExtendSessionModal() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.showSessionModal.set(false);
  }

  private startCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }

    const updateSeconds = () => {
      const exp = this.getTokenExpMs();
      if (!exp) {
        this.sessionSecondsLeft.set(0);
        return;
      }
      const left = Math.max(0, Math.ceil((exp - Date.now()) / 1000));
      this.sessionSecondsLeft.set(left);

      if (left <= 0 && !this.isRefreshing()) {
        this.logout(true);
      }
    };

    updateSeconds();
    this.countdownTimer = setInterval(updateSeconds, 1000);
  }

  notifyAccountDisabled() {
    this.clearSessionTimer();
    this.showSessionModal.set(false);
    this.showDisabledModal.set(true);
  }

  private setSession(user: UserProfile, token: string) {
    localStorage.setItem('profumi_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('profumi_token', token);
    }
    this.currentUser.set(user);
    this.startSessionTimer();
    this.sessionValidated.set(true);
  }

  private getTokenExpMs(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private startSessionTimer() {
    this.clearSessionTimer();

    const exp = this.getTokenExpMs();
    if (!exp) return;

    const msLeft = exp - Date.now();
    if (msLeft <= 0) {
      this.logout(true);
      return;
    }

    // 1. Mostrar modal e iniciar el contador regresivo cuando falten 20s
    const delayModal = Math.max(0, msLeft - this.WARNING_BEFORE_EXPIRY_MS);
    this.sessionTimer = setTimeout(() => {
      if (this.currentUser() && !this.showDisabledModal()) {
        this.openExtendSessionModal();
      }
    }, delayModal);

    // 2. Respaldo para cerrar sesión al expirar el token
    this.expiryTimer = setTimeout(() => {
      this.showSessionModal.set(false);
      this.logout(true);
    }, msLeft);

    // 3. Chequeo cada 4s para detectar si un admin deshabilitó la cuenta en vivo
    this.statusPollTimer = setInterval(() => {
      if (this.getToken() && !this.showDisabledModal()) {
        this.http.post(`${this.apiUrl}/autorizar`, {}).subscribe({
          error: () => {},
        });
      }
    }, 4000);
  }

  private clearSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    if (this.statusPollTimer) {
      clearInterval(this.statusPollTimer);
      this.statusPollTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  logout(redirectToLogin = false) {
    this.clearSessionTimer();
    this.showSessionModal.set(false);
    this.showDisabledModal.set(false);
    this.sessionValidated.set(false);
    localStorage.removeItem('profumi_user');
    localStorage.removeItem('profumi_token');
    this.currentUser.set(null);

    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }
}
