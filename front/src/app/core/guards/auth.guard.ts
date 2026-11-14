import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Solo deja pasar directo si ya validó el token en esta ejecución de la app
  if (authService.sessionValidated() && authService.currentUser() && authService.getToken()) {
    return true;
  }

  return router.createUrlTree(['/cargando']);
};
