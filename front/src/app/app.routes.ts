import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Cargando } from './features/auth/cargando/cargando';
import { Publicaciones } from './features/publicaciones/publicaciones';
import { PublicacionDetalle } from './features/publicaciones/publicacion-detalle/publicacion-detalle';
import { MiPerfil } from './features/perfil/mi-perfil/mi-perfil';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { Proximamente } from './features/proximamente/proximamente';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard'; // <-- 1. Importar adminGuard
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: 'cargando', component: Cargando },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'registro', component: Register, canActivate: [guestGuard] },

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
      { path: 'publicaciones', component: Publicaciones },
      { path: 'publicaciones/:id', component: PublicacionDetalle },
      { path: 'perfil', component: MiPerfil },
      {
        // <-- 2. Agregar este bloque para /dashboard
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        children: [
          { path: '', redirectTo: 'estadisticas', pathMatch: 'full' },
          {
            path: 'estadisticas',
            loadComponent: () =>
              import('./features/dashboard/estadisticas/estadisticas').then(
                (m) => m.DashboardEstadisticas,
              ),
          },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./features/dashboard/usuarios/usuarios').then((m) => m.DashboardUsuarios),
          },
        ],
      },
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

  { path: '**', redirectTo: 'cargando' },
];
