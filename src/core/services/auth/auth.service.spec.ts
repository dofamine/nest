import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { PrismaService } from '../../configs/prisma/prisma.service.js';
import type { SessionService } from '../../configs/session/session.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const request = {} as Request;
  const response = {} as Response;
  const user = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const session = {
    token: 'session-token',
    createdAt: new Date('2026-11-10T00:00:00Z'),
    expiresAt: new Date('2026-11-14T00:00:00Z'),
    user,
  };

  let findUnique: ReturnType<typeof vi.fn>;
  let updateManyAndReturn: ReturnType<typeof vi.fn>;
  let sessionService: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    isRenewable: ReturnType<typeof vi.fn>;
    isAbsoluteExpired: ReturnType<typeof vi.fn>;
    getRenewedExpiration: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(() => {
    findUnique = vi.fn().mockResolvedValue(session);
    updateManyAndReturn = vi.fn();
    sessionService = {
      get: vi.fn().mockReturnValue(session.token),
      set: vi.fn(),
      isRenewable: vi.fn().mockReturnValue(false),
      isAbsoluteExpired: vi.fn().mockReturnValue(false),
      getRenewedExpiration: vi.fn(),
    };

    service = new AuthService(
      {
        session: { findUnique, updateManyAndReturn },
      } as unknown as PrismaService,
      sessionService as unknown as SessionService,
    );
  });

  it('returns null without querying when the cookie is missing', async () => {
    sessionService.get.mockReturnValue(null);

    await expect(service.getSessionUser(request, response)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('returns null when no active session exists', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getSessionUser(request, response)).resolves.toBeNull();
  });

  it('rejects a session beyond its absolute lifetime', async () => {
    sessionService.isAbsoluteExpired.mockReturnValue(true);

    await expect(service.getSessionUser(request, response)).resolves.toBeNull();
    expect(sessionService.isRenewable).not.toHaveBeenCalled();
  });

  it('returns an active session user without unnecessary renewal', async () => {
    await expect(service.getSessionUser(request, response)).resolves.toBe(user);
    expect(updateManyAndReturn).not.toHaveBeenCalled();
    expect(sessionService.set).not.toHaveBeenCalled();
  });

  it('renews a session and updates its cookie before returning', async () => {
    const renewedExpiration = new Date('2026-11-16T00:00:00Z');
    sessionService.isRenewable.mockReturnValue(true);
    sessionService.getRenewedExpiration.mockReturnValue(renewedExpiration);
    updateManyAndReturn.mockResolvedValue([
      { token: session.token, expiresAt: renewedExpiration },
    ]);

    await expect(service.getSessionUser(request, response)).resolves.toBe(user);

    expect(updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          token: session.token,
          expiresAt: { gt: expect.any(Date) },
        },
        data: { expiresAt: renewedExpiration },
      }),
    );
    expect(sessionService.set).toHaveBeenCalledWith(
      response,
      session.token,
      renewedExpiration,
    );
  });

  it('returns the user without setting a cookie if a concurrent update no longer matches', async () => {
    sessionService.isRenewable.mockReturnValue(true);
    sessionService.getRenewedExpiration.mockReturnValue(new Date());
    updateManyAndReturn.mockResolvedValue([]);

    await expect(service.getSessionUser(request, response)).resolves.toBe(user);
    expect(sessionService.set).not.toHaveBeenCalled();
  });

  it('propagates renewal failures instead of creating an unhandled rejection', async () => {
    const error = new Error('Database unavailable');
    sessionService.isRenewable.mockReturnValue(true);
    sessionService.getRenewedExpiration.mockReturnValue(new Date());
    updateManyAndReturn.mockRejectedValue(error);

    await expect(service.getSessionUser(request, response)).rejects.toBe(error);
  });
});
