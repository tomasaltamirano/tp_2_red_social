import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss',
})
export class MiPerfil {
  authService = inject(AuthService);
  defaultAvatar = 'https://ui-avatars.com/api/?name=Coleccionista&background=5b5bf0&color=fff';
}