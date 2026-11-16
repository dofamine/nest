import { inject } from '@angular/core';
import { type CanActivateChildFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateChildFn = async () => {
  const api = inject(ApiService);
  const router = inject(Router);
  try {
    return (api.user() ?? (await api.loadUser()))
      ? true
      : router.createUrlTree(['/login']);
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { unavailable: '1' },
    });
  }
};
