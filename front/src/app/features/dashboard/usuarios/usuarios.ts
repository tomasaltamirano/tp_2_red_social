import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/enviroment';
import { AuthService, UserProfile } from '../../../core/services/auth';
import { TiempoRelativoPipe } from '../../../shared/pipes/tiempo-relativo';
import { RecortarPipe } from '../../../shared/pipes/recortar';
import { CopyTextDirective } from '../../../shared/directives/copy-text';
import { EdadPipe } from '../../../shared/pipes/edad';

@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TiempoRelativoPipe,
    RecortarPipe,
    CopyTextDirective,
    EdadPipe,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class DashboardUsuarios implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/usuarios`;

  defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=8c5a32&color=fff';

  usuarios = signal<UserProfile[]>([]);
  cargando = signal(false);
  busqueda = signal('');
  filtroRol = signal('');
  mensaje = signal<string | null>(null);

  mostrarModal = signal(false);
  guardando = signal(false);
  errorForm = signal<string | null>(null);
  archivo: File | null = null;

  miId = computed(() => this.auth.currentUser()?._id);

  usuariosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase().trim();
    const rol = this.filtroRol();
    return this.usuarios().filter((u) => {
      const coincideRol = !rol || u.perfil === rol;
      const coincideTexto =
        !q ||
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        u.nombreUsuario.toLowerCase().includes(q);
      return coincideRol && coincideTexto;
    });
  });

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
    fechaNacimiento: ['', Validators.required],
    descripcion: [''],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)],
    ],
    repetirPassword: ['', Validators.required],
    perfil: ['usuario' as 'usuario' | 'administrador', Validators.required],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.http.get<UserProfile[] | { items: UserProfile[] }>(this.apiUrl).subscribe({
      next: (res) => {
        const lista = Array.isArray(res) ? res : res.items;
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  usuarioConfirmar = signal<UserProfile | null>(null);

  pedirConfirmacion(u: UserProfile) {
    this.usuarioConfirmar.set(u);
  }

  confirmarCambioEstado() {
    const u = this.usuarioConfirmar();
    if (!u) return;

    const activo = u.activo !== false;
    const req$ = activo
      ? this.http.delete<{ message: string }>(`${this.apiUrl}/${u._id}`)
      : this.http.post<{ message: string }>(`${this.apiUrl}/${u._id}/habilitar`, {});

    req$.subscribe({
      next: (res) => {
        this.usuarioConfirmar.set(null);
        this.notificar(res.message);
        this.cargar();
      },
      error: (err) => {
        this.usuarioConfirmar.set(null);
        this.notificar(err.error?.message || 'Error al cambiar estado');
      },
    });
  }

  abrirModal() {
    this.form.reset({ perfil: 'usuario' });
    this.archivo = null;
    this.errorForm.set(null);
    this.mostrarModal.set(true);
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.archivo = input.files?.[0] || null;
  }

  crearUsuario() {
    if (this.form.invalid || !this.archivo) {
      this.errorForm.set('Completá todos los campos obligatorios y subí una imagen.');
      return;
    }
    const raw = this.form.getRawValue();
    if (raw.password !== raw.repetirPassword) {
      this.errorForm.set('Las contraseñas no coinciden.');
      return;
    }

    this.guardando.set(true);
    const fd = new FormData();
    Object.entries(raw).forEach(([k, v]) => fd.append(k, v));
    fd.append('imagen', this.archivo);

    this.http.post<{ message: string }>(this.apiUrl, fd).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.notificar(res.message);
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.message;
        this.errorForm.set(Array.isArray(msg) ? msg[0] : msg || 'Error al crear usuario');
      },
    });
  }

  private notificar(texto: string) {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(null), 3500);
  }
}
