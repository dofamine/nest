import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthService } from '../../services/auth/auth.service.js';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  const request: Record<string, unknown> = {};
  const response = {};
  const handler = () => undefined;
  class TestController {}

  let authService: { getSessionUser: ReturnType<typeof vi.fn> };
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let guard: AuthGuard;
  let context: ExecutionContext;

  beforeEach(() => {
    for (const key of Object.keys(request)) delete request[key];

    authService = { getSessionUser: vi.fn() };
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    guard = new AuthGuard(
      authService as unknown as AuthService,
      reflector as unknown as Reflector,
    );
    context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
        getNext: () => undefined,
      }),
    } as unknown as ExecutionContext;
  });

  it('allows public handlers without reading a session', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(authService.getSessionUser).not.toHaveBeenCalled();
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
      handler,
      TestController,
    ]);
  });

  it('rejects protected handlers without a valid session', async () => {
    authService.getSessionUser.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the authenticated user to the request', async () => {
    const user = { id: 'user-1', email: 'alice@example.com' };
    authService.getSessionUser.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toBe(user);
    expect(authService.getSessionUser).toHaveBeenCalledWith(request, response);
  });
});
