import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const repeat = group.get('repetirPassword')?.value;
  return pass && repeat && pass !== repeat ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  fileError = signal<string | null>(null);
  serverError = signal<string | null>(null);
  showSuccessModal = signal(false);
  isLoading = signal(false);

  registerForm = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: [
        '',
        [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_.-]+$/)],
      ],
      fechaNacimiento: ['', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.maxLength(250)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      repetirPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  get f() {
    return this.registerForm.controls;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.fileError.set(null);

    if (!file) {
      this.selectedFile.set(null);
      this.imagePreview.set(null);
      return;
    }

    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      this.fileError.set('Seleccioná una imagen válida (JPG, PNG o WEBP).');
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.registerForm.invalid || !this.selectedFile()) {
      this.registerForm.markAllAsTouched();
      if (!this.selectedFile()) {
        this.fileError.set('La imagen de perfil es obligatoria.');
      }
      return;
    }

    this.isLoading.set(true);
    this.serverError.set(null);

    const raw = this.registerForm.getRawValue();
    const formData = new FormData();
    Object.entries(raw).forEach(([key, value]) => formData.append(key, value));
    formData.append('imagen', this.selectedFile()!);

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showSuccessModal.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message;
        this.serverError.set(
          Array.isArray(msg) ? msg[0] : msg || 'No se pudo completar el registro.',
        );
      },
    });
  }

  goToFeed() {
    this.showSuccessModal.set(false);
    this.router.navigate(['/publicaciones']);
  }
}