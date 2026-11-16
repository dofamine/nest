import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../services/session.store';

/** Expired sessions on protected requests return the user to sign in. */
export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  const protectedRequest = [
    '/user/@me',
    '/user/invite',
    '/user/logout-all',
  ].includes(request.url);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        protectedRequest &&
        error instanceof HttpErrorResponse &&
        error.status === 401
      ) {
        const wasSignedIn = session.user() !== null;
        session.user.set(null);
        if (wasSignedIn)
          void router.navigate(['/login'], { queryParams: { expired: '1' } });
      }
      return throwError(() => error);
    }),
  );
};
