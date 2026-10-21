import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Publicaciones } from './features/publicaciones/publicaciones/publicaciones';
import { MiPerfil } from './features/perfil/mi-perfil/mi-perfil';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Register },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
      { path: 'publicaciones', component: Publicaciones },
      { path: 'perfil', component: MiPerfil },
    ],
  },

  { path: '**', redirectTo: 'publicaciones' },
];
