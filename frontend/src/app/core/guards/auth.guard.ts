import { inject } from '@angular/core';
import { type CanActivateChildFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateChildFn = async () => {
  const users = inject(UserService);
  const router = inject(Router);
  try {
    return (users.user() ?? (await users.loadUser()))
      ? true
      : router.createUrlTree(['/login']);
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { unavailable: '1' },
    });
  }
};
