import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let clonedReq = req.clone({
    withCredentials: true,
  });

  if (token) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isPublicOrCheckEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/registro') ||
        req.url.includes('/auth/autorizar');

      if (error.status === 401) {
        const msg = error.error?.message || '';
        const isDisabled = typeof msg === 'string' && msg.toLowerCase().includes('deshabilitada');

        // Si fue deshabilitado y ya estaba dentro de la app, mostramos el modal en el acto
        if (isDisabled && !req.url.includes('/auth/login')) {
          authService.notifyAccountDisabled();
        } else if (!isPublicOrCheckEndpoint) {
          authService.logout(true);
        }
      }

      return throwError(() => error);
    }),
  );
};
