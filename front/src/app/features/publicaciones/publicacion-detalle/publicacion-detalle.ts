import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ComentarioItem,
  PublicacionItem,
  PublicacionesService,
} from '../../../core/services/publicaciones';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.scss',
})
export class PublicacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);
  authService = inject(AuthService);

  defaultAvatar = 'https://ui-avatars.com/api/?name=Coleccionista&background=8c5a32&color=fff';

  post = signal<PublicacionItem | null>(null);
  isLoadingPost = signal(true);
  errorBanner = signal<string | null>(null);

  // Estado de Comentarios paginados ("Cargar más")
  comentarios = signal<ComentarioItem[]>([]);
  totalComentarios = signal(0);
  comentariosOffset = signal(0);
  readonly comentariosLimit = 4;
  hasMoreComentarios = signal(false);
  isLoadingComentarios = signal(false);
  isSubmittingComment = signal(false);

  // Estado de edición de comentario
  editingCommentId = signal<string | null>(null);
  isSavingEdit = signal(false);

  // Modal de baja lógica de la publicación
  showDeleteModal = signal(false);
  isDeleting = signal(false);

  commentForm = this.fb.nonNullable.group({
    mensaje: ['', [Validators.required, Validators.maxLength(500)]],
  });

  editCommentForm = this.fb.nonNullable.group({
    mensaje: ['', [Validators.required, Validators.maxLength(500)]],
  });

  isLiked = computed(() => {
    const uid = this.authService.currentUser()?._id;
    const p = this.post();
    if (!uid || !p) return false;
    return p.likes.includes(uid);
  });

  canDelete = computed(() => {
    const user = this.authService.currentUser();
    const p = this.post();
    if (!user || !p) return false;
    return p.usuario._id === user._id || user.perfil === 'administrador';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/publicaciones']);
      return;
    }
    this.cargarPublicacion(id);
    this.cargarComentarios(id, true);
  }

  cargarPublicacion(id: string) {
    this.isLoadingPost.set(true);
    this.publicacionesService.obtenerPorId(id).subscribe({
      next: (data) => {
        this.post.set(data);
        this.isLoadingPost.set(false);
      },
      error: (err) => {
        this.isLoadingPost.set(false);
        this.errorBanner.set(err.error?.message || 'La publicación no existe o fue eliminada.');
      },
    });
  }

  cargarComentarios(id: string, reset = false) {
    if (reset) {
      this.comentariosOffset.set(0);
    }

    this.isLoadingComentarios.set(true);
    this.publicacionesService
      .obtenerComentarios(id, this.comentariosOffset(), this.comentariosLimit)
      .subscribe({
        next: (res) => {
          if (reset) {
            this.comentarios.set(res.items);
          } else {
            this.comentarios.update((prev) => [...prev, ...res.items]);
          }
          this.totalComentarios.set(res.total);
          this.hasMoreComentarios.set(res.hasMore);
          this.comentariosOffset.set(res.offset + res.items.length);
          this.isLoadingComentarios.set(false);
        },
        error: () => {
          this.isLoadingComentarios.set(false);
        },
      });
  }

  cargarMasComentarios() {
    const p = this.post();
    if (!p || !this.hasMoreComentarios() || this.isLoadingComentarios()) return;
    this.cargarComentarios(p._id, false);
  }

  onToggleLike() {
    const p = this.post();
    const uid = this.authService.currentUser()?._id;
    if (!p || !uid) return;

    const req$ = this.isLiked()
      ? this.publicacionesService.quitarMeGusta(p._id)
      : this.publicacionesService.darMeGusta(p._id);

    req$.subscribe({
      next: (res) => {
        this.post.update((curr) =>
          curr ? { ...curr, likes: res.likes, likesCount: res.likesCount } : null,
        );
      },
    });
  }

  enviarComentario() {
    const p = this.post();
    if (!p || this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const mensaje = this.commentForm.controls.mensaje.value.trim();
    if (!mensaje) return;

    this.isSubmittingComment.set(true);
    this.publicacionesService.agregarComentario(p._id, mensaje).subscribe({
      next: (res) => {
        this.isSubmittingComment.set(false);
        this.commentForm.reset();
        // Insertamos el nuevo comentario al principio (más recientes primero)
        this.comentarios.update((lista) => [res.comentario, ...lista]);
        this.totalComentarios.set(res.totalComentarios);
        this.comentariosOffset.update((off) => off + 1);
      },
      error: (err) => {
        this.isSubmittingComment.set(false);
        this.errorBanner.set(err.error?.message || 'No se pudo publicar el comentario.');
      },
    });
  }

  iniciarEdicion(com: ComentarioItem) {
    this.editingCommentId.set(com._id);
    this.editCommentForm.setValue({ mensaje: com.mensaje });
  }

  cancelarEdicion() {
    this.editingCommentId.set(null);
    this.editCommentForm.reset();
  }

  guardarEdicion(comentarioId: string) {
    const p = this.post();
    if (!p || this.editCommentForm.invalid) return;

    const nuevoMensaje = this.editCommentForm.controls.mensaje.value.trim();
    if (!nuevoMensaje) return;

    this.isSavingEdit.set(true);
    this.publicacionesService.editarComentario(p._id, comentarioId, nuevoMensaje).subscribe({
      next: (res) => {
        this.isSavingEdit.set(false);
        this.editingCommentId.set(null);
        this.comentarios.update((lista) =>
          lista.map((c) => (c._id === comentarioId ? res.comentario : c)),
        );
      },
      error: (err) => {
        this.isSavingEdit.set(false);
        this.errorBanner.set(err.error?.message || 'No se pudo editar el comentario.');
      },
    });
  }

  ejecutarEliminacion() {
    const p = this.post();
    if (!p) return;

    this.isDeleting.set(true);
    this.publicacionesService.eliminar(p._id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.showDeleteModal.set(false);
        this.errorBanner.set(err.error?.message || 'No se pudo eliminar la publicación.');
      },
    });
  }
}
