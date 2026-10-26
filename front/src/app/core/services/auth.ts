import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<UserProfile | null>(this.loadStoredUser());

  private loadStoredUser(): UserProfile | null {
    const raw = localStorage.getItem('profumi_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  register(formData: FormData): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}/registro`, formData).pipe(
      tap((user) => this.setSession(user)),
    );
  }

  login(data: LoginData): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.apiUrl}/login`, data).pipe(
      tap((user) => this.setSession(user)),
    );
  }

  private setSession(user: UserProfile) {
    localStorage.setItem('profumi_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('profumi_user');
    this.currentUser.set(null);
  }
}