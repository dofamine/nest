import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { TAuthRequest } from '../../../shared/types/session-user.js';
import { RoleGuard } from './role.guard.js';

describe('RoleGuard', () => {
  const request = {} as TAuthRequest;
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: vi.fn(() => ({
      getRequest: vi.fn(() => request),
    })),
  } as unknown as ExecutionContext;
  const reflector = {
    getAllAndOverride: vi.fn(),
  };
  const guard = new RoleGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    vi.clearAllMocks();
    delete request.user;
  });

  it('allows access when the route has no role requirement', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a user with an accepted role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    request.user = { role: 'admin' } as TAuthRequest['user'];

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a user without an accepted role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    request.user = { role: 'therapist' } as TAuthRequest['user'];

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
