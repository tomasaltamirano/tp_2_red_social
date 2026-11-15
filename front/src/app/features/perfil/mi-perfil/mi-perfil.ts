import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { PublicacionItem, PublicacionesService } from '../../../core/services/publicaciones';
import { PostCardComponent } from '../../publicaciones/post-card/post-card';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PostCardComponent],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil implements OnInit {
  authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);

  defaultAvatar = 'https://ui-avatars.com/api/?name=Coleccionista&background=8c5a32&color=fff';

  misUltimasPublicaciones = signal<PublicacionItem[]>([]);
  isLoadingPosts = signal(false);

  // Estado para edición de perfil
  isEditingProfile = signal(false);
  isSavingProfile = signal(false);
  editError = signal<string | null>(null);
  selectedAvatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  editForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.maxLength(250)]],
  });

  // Estado para eliminación de publicación
  postToDelete = signal<PublicacionItem | null>(null);
  isDeleting = signal(false);

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
        error: () => this.isLoadingPosts.set(false),
      });
  }

  abrirEditarPerfil() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.editForm.patchValue({
      nombre: user.nombre,
      apellido: user.apellido,
      descripcion: user.descripcion || '',
    });
    this.selectedAvatarFile.set(null);
    this.avatarPreview.set(user.imagenPerfil || null);
    this.editError.set(null);
    this.isEditingProfile.set(true);
  }

  cerrarEditarPerfil() {
    this.isEditingProfile.set(false);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.editError.set('Seleccioná una imagen válida (JPG, PNG o WEBP).');
      return;
    }

    this.editError.set(null);
    this.selectedAvatarFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  guardarPerfil() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.editError.set('El nombre y apellido deben tener al menos 2 caracteres (bio máx. 250).');
      return;
    }

    this.isSavingProfile.set(true);
    this.editError.set(null);

    const { nombre, apellido, descripcion } = this.editForm.getRawValue();
    const formData = new FormData();
    formData.append('nombre', nombre.trim());
    formData.append('apellido', apellido.trim());
    formData.append('descripcion', descripcion.trim());

    const file = this.selectedAvatarFile();
    if (file) {
      formData.append('imagen', file);
    }

    this.authService.updateProfile(formData).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.isEditingProfile.set(false);
        this.cargarMisUltimasPublicaciones();
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        const msg = err.error?.message;
        this.editError.set(
          Array.isArray(msg)
            ? msg[0]
            : msg || 'No se pudo actualizar el perfil. Revisá que el backend esté corriendo.',
        );
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

  confirmarEliminacion(post: PublicacionItem) {
    this.postToDelete.set(post);
  }

  cancelarEliminacion() {
    this.postToDelete.set(null);
  }

  ejecutarEliminacion() {
    const target = this.postToDelete();
    if (!target) return;

    this.isDeleting.set(true);
    this.publicacionesService.eliminar(target._id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
        this.cargarMisUltimasPublicaciones();
      },
      error: () => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
      },
    });
  }
}
