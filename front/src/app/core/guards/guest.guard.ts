// front/src/app/core/guards/guest.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya existe un token, lo sacamos del login y lo mandamos al inicio
  if (auth.getToken()) {
    return router.createUrlTree(['/publicaciones']);
  }

  return true;
};
