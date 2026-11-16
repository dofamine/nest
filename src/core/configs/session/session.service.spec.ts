import type { Request, Response } from 'express';
import type { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from './session.service.js';

describe('SessionService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createService(nodeEnv = 'development') {
    return new SessionService({
      get: vi.fn().mockReturnValue(nodeEnv),
    } as unknown as ConfigService);
  }

  it('sets an HTTP-only same-site cookie with the supplied expiration', () => {
    const service = createService('production');
    const expiresAt = new Date('2026-11-14T00:00:00Z');
    const cookie = vi.fn();

    service.setSession({ cookie } as unknown as Response, 'token', expiresAt);

    expect(cookie).toHaveBeenCalledWith('session', 'token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
  });

  it('uses the standard session duration when no cookie expiration is supplied', () => {
    const service = createService();
    const now = new Date('2026-11-13T12:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const cookie = vi.fn();

    service.setSession({ cookie } as unknown as Response, 'token');

    expect(cookie).toHaveBeenCalledWith(
      'session',
      'token',
      expect.objectContaining({
        expires: new Date(now + service.sessionDurationTime),
      }),
    );
  });

  it('clears the cookie with matching options', () => {
    const service = createService();
    const clearCookie = vi.fn();

    service.deleteSession({ clearCookie } as unknown as Response);

    expect(clearCookie).toHaveBeenCalledWith('session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('reads only string cookie values', () => {
    const service = createService();

    expect(
      service.getSession({
        cookies: { session: 'token' },
      } as unknown as Request),
    ).toBe('token');
    expect(
      service.getSession({ cookies: { session: 123 } } as unknown as Request),
    ).toBeNull();
    expect(service.getSession({} as Request)).toBeNull();
  });

  it('renews only active sessions within the renewal threshold', () => {
    const service = createService();
    const now = new Date('2026-11-13T12:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const createdAt = new Date(now - service.sessionDurationTime);

    expect(
      service.canBeRenewed({
        createdAt,
        expiresAt: new Date(now + service.sessionDurationTime * 0.3),
      }),
    ).toBe(true);
    expect(
      service.canBeRenewed({
        createdAt,
        expiresAt: new Date(now + service.sessionDurationTime * 0.31),
      }),
    ).toBe(false);
    expect(service.canBeRenewed({ createdAt, expiresAt: new Date(now) })).toBe(
      false,
    );
  });

  it('never renews a session at or beyond its absolute lifetime', () => {
    const service = createService();
    const now = new Date('2026-11-13T12:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(
      service.canBeRenewed({
        createdAt: new Date(now - service.sessionAbsoluteDurationTime),
        expiresAt: new Date(now + 60_000),
      }),
    ).toBe(false);
  });

  it('caps renewed expiration at the absolute lifetime', () => {
    const service = createService();
    const now = new Date('2026-11-13T12:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const absoluteExpiration = new Date(now + 60 * 60 * 1000);
    const createdAt = new Date(
      absoluteExpiration.getTime() - service.sessionAbsoluteDurationTime,
    );

    expect(service.getRenewedExpiration({ createdAt })).toEqual(
      absoluteExpiration,
    );
  });
});
