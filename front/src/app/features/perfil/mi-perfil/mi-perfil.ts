import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PublicacionItem, PublicacionesService } from '../../../core/services/publicaciones';
import { PostCardComponent } from '../../publicaciones/post-card/post-card';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil implements OnInit {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  defaultAvatar = 'https://ui-avatars.com/api/?name=Coleccionista&background=8c5a32&color=fff';

  misUltimasPublicaciones = signal<PublicacionItem[]>([]);
  isLoadingPosts = signal(false);

  ngOnInit() {
    this.cargarMisUltimasPublicaciones();
  }

  cargarMisUltimasPublicaciones() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.isLoadingPosts.set(true);
    this.publicacionesService
      .listar({
        userId: user._id,
        sortBy: 'fecha',
        offset: 0,
        limit: 3, // Consigna Sprint 2: últimas 3 publicaciones
      })
      .subscribe({
        next: (res) => {
          this.misUltimasPublicaciones.set(res.items);
          this.isLoadingPosts.set(false);
        },
        error: () => {
          this.isLoadingPosts.set(false);
        },
      });
  }

  onToggleLike(post: PublicacionItem) {
    const uid = this.authService.currentUser()?._id;
    if (!uid) return;

    const yaDioLike = post.likes.includes(uid);
    const req$ = yaDioLike
      ? this.publicacionesService.quitarMeGusta(post._id)
      : this.publicacionesService.darMeGusta(post._id);

    req$.subscribe({
      next: (res) => {
        this.misUltimasPublicaciones.update((lista) =>
          lista.map((p) =>
            p._id === post._id ? { ...p, likes: res.likes, likesCount: res.likesCount } : p,
          ),
        );
      },
    });
  }

  onEliminarPublicacion(post: PublicacionItem) {
    this.publicacionesService.eliminar(post._id).subscribe({
      next: () => {
        this.cargarMisUltimasPublicaciones();
      },
    });
  }
}
