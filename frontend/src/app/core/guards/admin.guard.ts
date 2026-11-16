import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { SessionStore } from '../services/session.store';

// Runs after the private parent has restored the session with authGuard.
export const adminGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  return session.user()?.role === 'admin' ? true : router.createUrlTree(['/']);
};
