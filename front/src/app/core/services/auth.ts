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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/auth`;

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  // Para la demo de 1 minuto (60s), el aviso salta automáticamente a los 40s.
  // (Si volvés a 15m, cambialo a 10 * 60 * 1000).
  private readonly WARNING_TIME_MS = 40 * 1000;

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

  private startSessionTimer() {
    this.clearSessionTimer();
    this.sessionTimer = setTimeout(() => {
      if (this.currentUser()) {
        this.showSessionModal.set(true);
      }
    }, this.WARNING_TIME_MS);
  }

  private clearSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
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
