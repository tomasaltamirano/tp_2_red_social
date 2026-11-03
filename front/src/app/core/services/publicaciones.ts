import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/enviroment';

export interface AutorPublicacion {
  _id: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  imagenPerfil: string;
  perfil: 'usuario' | 'administrador';
}

export interface ComentarioItem {
  _id: string;
  usuario: AutorPublicacion;
  mensaje: string;
  modificado: boolean;
  createdAt: string;
}

export interface PublicacionItem {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl?: string;
  notas: string[];
  usuario: AutorPublicacion;
  likes: string[];
  likesCount: number;
  comentarios: ComentarioItem[];
  activo: boolean;
  createdAt: string;
}

export interface PaginatedPublicaciones {
  items: PublicacionItem[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface LikeResponse {
  message: string;
  likesCount: number;
  likes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/publicaciones`;

  listar(options: {
    sortBy?: 'fecha' | 'likes';
    offset?: number;
    limit?: number;
    userId?: string;
  }): Observable<PaginatedPublicaciones> {
    let params = new HttpParams()
      .set('sortBy', options.sortBy || 'fecha')
      .set('offset', (options.offset ?? 0).toString())
      .set('limit', (options.limit ?? 5).toString());

    if (options.userId) {
      params = params.set('userId', options.userId);
    }

    return this.http.get<PaginatedPublicaciones>(this.apiUrl, { params });
  }

  crear(formData: FormData): Observable<PublicacionItem> {
    return this.http.post<PublicacionItem>(this.apiUrl, formData);
  }

  eliminar(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/${id}`);
  }

  darMeGusta(id: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/${id}/like`, {});
  }

  quitarMeGusta(id: string): Observable<LikeResponse> {
    return this.http.delete<LikeResponse>(`${this.apiUrl}/${id}/like`);
  }
}
