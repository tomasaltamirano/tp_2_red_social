import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicacionItem, PublicacionesService } from '../../core/services/publicaciones';
import { AuthService } from '../../../app/core/services/auth';
import { PostCardComponent } from '../publicaciones/post-card/post-card';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PostCardComponent],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.scss',
})
export class Publicaciones implements OnInit {
  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);
  authService = inject(AuthService);

  defaultAvatar = 'https://ui-avatars.com/api/?name=Profumi&background=8c5a32&color=fff';

  @ViewChild('descInput') descInput?: ElementRef<HTMLTextAreaElement>;

  // Compositor estilo X
  showNotas = signal(false);
  showPollModal = signal(false);
  readonly maxDescripcion = 1500;

  posts = signal<PublicacionItem[]>([]);
  total = signal(0);
  limit = signal(4); // Cantidad limitada por página para demostrar paginación cómodamente
  offset = signal(0);
  sortBy = signal<'fecha' | 'likes'>('fecha');

  isLoading = signal(false);
  isCreating = signal(false);
  errorBanner = signal<string | null>(null);

  // Estado para subida de imagen opcional en nueva publicación
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  fileError = signal<string | null>(null);

  // Modal de confirmación para eliminar publicación
  postToDelete = signal<PublicacionItem | null>(null);
  isDeleting = signal(false);

  currentPage = computed(() => Math.floor(this.offset() / this.limit()) + 1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  postForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, Validators.maxLength(1500)]],
    notas: [''],
  });

  get f() {
    return this.postForm.controls;
  }

  ngOnInit() {
    this.cargarPublicaciones();
  }

  cargarPublicaciones() {
    this.isLoading.set(true);
    this.errorBanner.set(null);

    this.publicacionesService
      .listar({
        sortBy: this.sortBy(),
        offset: this.offset(),
        limit: this.limit(),
      })
      .subscribe({
        next: (res) => {
          this.posts.set(res.items);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorBanner.set(err.error?.message || 'No se pudieron cargar las publicaciones.');
        },
      });
  }

  cambiarOrden(nuevoOrden: 'fecha' | 'likes') {
    if (this.sortBy() === nuevoOrden) return;
    this.sortBy.set(nuevoOrden);
    this.offset.set(0);
    this.cargarPublicaciones();
  }

  paginaAnterior() {
    if (this.offset() === 0) return;
    this.offset.update((val) => Math.max(0, val - this.limit()));
    this.cargarPublicaciones();
  }

  paginaSiguiente() {
    if (this.offset() + this.limit() >= this.total()) return;
    this.offset.update((val) => val + this.limit());
    this.cargarPublicaciones();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError.set(null);

    if (!file) {
      this.removeSelectedImage();
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.fileError.set('Formato inválido. Solo se permite JPG, PNG o WEBP.');
      this.removeSelectedImage();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.fileError.set('La imagen no puede superar los 5MB.');
      this.removeSelectedImage();
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  autoGrow(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  removeSelectedImage() {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }

  crearPublicacion() {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.errorBanner.set(null);

    const raw = this.postForm.getRawValue();
    const formData = new FormData();
    formData.append('titulo', raw.titulo.trim());
    formData.append('descripcion', raw.descripcion.trim());
    if (raw.notas.trim()) {
      formData.append('notas', raw.notas.trim());
    }
    if (this.selectedFile()) {
      formData.append('imagen', this.selectedFile()!);
    }

    this.publicacionesService.crear(formData).subscribe({
      next: () => {
        this.isCreating.set(false);
        this.postForm.reset();
        this.removeSelectedImage();
        this.showNotas.set(false);
        if (this.descInput) this.descInput.nativeElement.style.height = 'auto';
        this.offset.set(0);
        this.cargarPublicaciones();
      },
      error: (err) => {
        this.isCreating.set(false);
        const msg = err.error?.message;
        this.errorBanner.set(Array.isArray(msg) ? msg[0] : msg || 'Error al publicar tu reseña.');
      },
    });
  }

  onToggleLike(post: PublicacionItem) {
    const uid = this.authService.currentUser()?._id;
    if (!uid) return;

    const yaDioLike = post.likes.includes(uid);
    const request$ = yaDioLike
      ? this.publicacionesService.quitarMeGusta(post._id)
      : this.publicacionesService.darMeGusta(post._id);

    request$.subscribe({
      next: (res) => {
        this.posts.update((lista) => {
          const actualizada = lista.map((item) =>
            item._id === post._id
              ? { ...item, likes: res.likes, likesCount: res.likesCount }
              : item,
          );

          if (this.sortBy() === 'likes') {
            return [...actualizada].sort(
              (a, b) =>
                b.likesCount - a.likesCount ||
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
          }

          return actualizada;
        });
      },
      error: (err) => {
        this.errorBanner.set(err.error?.message || 'No se pudo procesar tu reacción.');
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
        // Si eliminamos el único ítem de la página actual y no es la primera página, retrocedemos
        if (this.posts().length === 1 && this.offset() > 0) {
          this.offset.update((val) => Math.max(0, val - this.limit()));
        }
        this.cargarPublicaciones();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.postToDelete.set(null);
        this.errorBanner.set(err.error?.message || 'No se pudo eliminar la publicación.');
      },
    });
  }
}
