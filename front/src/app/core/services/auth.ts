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

  // El token dura 15 minutos. A los 10 minutos (cuando faltan 5 minutos para vencer)
  // aparece el modal preguntando si desea extender la sesión.
  private readonly WARNING_BEFORE_EXPIRY_MS = 20 * 1000;

  currentUser = signal<UserProfile | null>(this.loadStoredUser());
  showSessionModal = signal<boolean>(false);
  isRefreshing = signal<boolean>(false);

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
          this.setSession(res.user, res.access_token);
          this.showSessionModal.set(false);
          this.isRefreshing.set(false);
        },
        error: () => {
          this.isRefreshing.set(false);
          this.logout(true);
        },
      }),
    );
  }

  openExtendSessionModal() {
    this.showSessionModal.set(true);
  }

  closeExtendSessionModal() {
    this.showSessionModal.set(false);
  }

  private setSession(user: UserProfile, token: string) {
    localStorage.setItem('profumi_user', JSON.stringify(user));
    if (token) {
      localStorage.setItem('profumi_token', token);
    }
    this.currentUser.set(user);
    this.startSessionTimer();
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

    this.sessionTimer = setTimeout(
      () => {
        if (this.currentUser()) this.showSessionModal.set(true);
      },
      Math.max(0, msLeft - this.WARNING_BEFORE_EXPIRY_MS),
    );

    this.expiryTimer = setTimeout(() => this.logout(true), msLeft);
  }

  private clearSessionTimer() {
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.sessionTimer = null;
    this.expiryTimer = null;
  }

  logout(redirectToLogin = false) {
    this.clearSessionTimer();
    this.showSessionModal.set(false);
    localStorage.removeItem('profumi_user');
    localStorage.removeItem('profumi_token');
    this.currentUser.set(null);

    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({ error: () => {} });

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }
}

//private readonly WARNING_BEFORE_EXPIRY_MS = 20 * 1000;
