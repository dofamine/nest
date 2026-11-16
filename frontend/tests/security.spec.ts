import '@angular/compiler';
import {
  createEnvironmentInjector,
  runInInjectionContext,
  signal,
  type EnvironmentInjector,
} from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import {
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import { firstValueFrom, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { authGuard } from '../src/app/core/guards/auth.guard';
import { adminGuard } from '../src/app/core/guards/admin.guard';
import { sessionInterceptor } from '../src/app/core/interceptors/session.interceptor';
import { ApiService } from '../src/app/core/services/api.service';
import { SessionStore } from '../src/app/core/services/session.store';
import { publicRoutes } from '../src/app/routes/public.routes';
import { privateRoutes } from '../src/app/routes/private.routes';

describe('frontend access boundaries', () => {
  it.each(['admin', 'therapist', null])(
    'limits Users navigation to admins (role: %s)',
    (role) => {
      const createUrlTree = vi.fn().mockReturnValue('dashboard-redirect');
      const injector = createEnvironmentInjector(
        [
          {
            provide: SessionStore,
            useValue: { user: () => (role ? { role } : null) },
          },
          { provide: Router, useValue: { createUrlTree } },
        ],
        null as unknown as EnvironmentInjector,
      );
      try {
        const result = runInInjectionContext(injector, () =>
          adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        );
        expect(result).toBe(role === 'admin' ? true : 'dashboard-redirect');
        expect(
          privateRoutes[0].children?.find((route) => route.path === 'users')
            ?.canActivate,
        ).toEqual([adminGuard]);
      } finally {
        injector.destroy();
      }
    },
  );
  it('keeps emailed links public and protects all private children', () => {
    expect(publicRoutes.map((route) => route.path)).toEqual([
      'login',
      'invite/:invitationId',
      'forgot-password',
      'reset-password',
    ]);
    expect(
      publicRoutes.every(
        (route) => !route.canActivate && !route.canActivateChild,
      ),
    ).toBe(true);
    expect(privateRoutes[0].canActivateChild).toEqual([authGuard]);
  });

  it.each([true, false])(
    'restores a session before allowing private navigation (signed in: %s)',
    async (signedIn) => {
      const user = { id: 'user-1', role: 'therapist' };
      const loadUser = vi.fn().mockResolvedValue(signedIn ? user : null);
      const injector = createEnvironmentInjector(
        [
          { provide: ApiService, useValue: { user: () => null, loadUser } },
          {
            provide: Router,
            useValue: { createUrlTree: () => 'login-redirect' },
          },
        ],
        null as unknown as EnvironmentInjector,
      );
      try {
        const result = await runInInjectionContext(injector, () =>
          authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        );
        expect(loadUser).toHaveBeenCalledOnce();
        expect(result).toBe(signedIn ? true : 'login-redirect');
      } finally {
        injector.destroy();
      }
    },
  );

  it.each([
    ['/user/invite', 401, true],
    ['/user/login', 401, false],
    ['/user/invite', 403, false],
  ])(
    'handles %s status %s without confusing authentication and authorization',
    async (url, status, shouldRedirect) => {
      const user = signal<unknown>({ id: 'user-1' });
      const navigate = vi.fn().mockResolvedValue(true);
      const injector = createEnvironmentInjector(
        [
          { provide: SessionStore, useValue: { user } },
          { provide: Router, useValue: { navigate } },
        ],
        null as unknown as EnvironmentInjector,
      );
      const error = new HttpErrorResponse({ status });
      try {
        const response = runInInjectionContext(injector, () =>
          sessionInterceptor(new HttpRequest('GET', url), () =>
            throwError(() => error),
          ),
        );
        await expect(firstValueFrom(response)).rejects.toBe(error);
        expect(navigate).toHaveBeenCalledTimes(shouldRedirect ? 1 : 0);
        expect(user() === null).toBe(shouldRedirect);
      } finally {
        injector.destroy();
      }
    },
  );
});
