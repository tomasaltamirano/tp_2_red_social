import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Publicaciones } from './features/publicaciones/publicaciones';
import { MiPerfil } from './features/perfil/mi-perfil/mi-perfil';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Proximamente } from './features/proximamente/proximamente';

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
      {
        path: 'guardados',
        component: Proximamente,
        data: {
          titulo: 'Guardados',
          icono: 'ph-bookmark-simple',
          texto: 'Pronto vas a poder guardar tus reseñas favoritas para volver a ellas.',
        },
      },
      {
        path: 'ranking',
        component: Proximamente,
        data: {
          titulo: 'Ranking semanal',
          icono: 'ph-trophy',
          texto: 'Las reseñas más votadas de la semana van a aparecer acá.',
        },
      },
    ],
  },

  { path: '**', redirectTo: 'publicaciones' },
];
