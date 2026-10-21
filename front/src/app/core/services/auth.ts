import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterData {
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  password: string;
  repetirPassword: string;
  fechaNacimiento: string;
  descripcion?: string;
  imagenPerfil?: string;
  perfil?: string;
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
  private apiUrl = 'http://localhost:3000/auth';

  register(data: RegisterData): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro`, data);
  }

  login(data: LoginData): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }
}
