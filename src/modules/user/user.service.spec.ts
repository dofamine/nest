import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from './user.service.js';
import type { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import type { SessionService } from '../../core/configs/session/session.service.js';
import type { Mailer } from '@nestjs/mail';
import type { ConfigService } from '@nestjs/config';

describe('UserService session revocation', () => {
  let sessions: Array<{ token: string; userId: string; expiresAt: Date }>;
  let service: UserService;
  let deleteMany: ReturnType<typeof vi.fn>;
  let expiresAt: Date;

  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    expiresAt = new Date(Date.now() + 60_000);
    sessions = [
      { token: 'alice-laptop', userId: 'alice', expiresAt },
      { token: 'alice-phone', userId: 'alice', expiresAt },
      { token: 'bob-laptop', userId: 'bob', expiresAt },
    ];

    deleteMany = vi.fn(
      async ({ where }: { where: { token?: string; userId?: string } }) => {
        const originalCount = sessions.length;
        sessions = sessions.filter(
          (session) =>
            !Object.entries(where).every(
              ([key, value]) => session[key as keyof typeof session] === value,
            ),
        );
        return { count: originalCount - sessions.length };
      },
    );

    const session = {
      deleteMany,
      findUnique: vi.fn(async ({ where }: { where: { token: string } }) => {
        return sessions.find((item) => item.token === where.token) ?? null;
      }),
    };
    const prisma = {
      session,
      $transaction: vi.fn(
        async (callback: (tx: { session: typeof session }) => Promise<void>) =>
          callback({ session }),
      ),
    };

    service = new UserService(
      prisma as unknown as PrismaService,
      {} as SessionService,
      {} as Mailer,
      {
        getOrThrow: vi.fn().mockReturnValue('https://app.example.com'),
      } as unknown as ConfigService,
    );
  });

  it('revokes only the current session and allows repeated logout', async () => {
    await expect(service.logout('alice-laptop')).resolves.toBe(true);
    await expect(service.logout('alice-laptop')).resolves.toBe(true);

    expect(sessions).toEqual([
      { token: 'alice-phone', userId: 'alice', expiresAt },
      { token: 'bob-laptop', userId: 'bob', expiresAt },
    ]);
  });

  it('leaves sessions unchanged when logging out with an unknown token', async () => {
    await expect(service.logout('unknown')).resolves.toBe(true);
    expect(sessions).toHaveLength(3);
  });

  it('revokes all sessions belonging to the token owner only', async () => {
    await service.logoutAll('alice-laptop');
    expect(sessions).toEqual([
      { token: 'bob-laptop', userId: 'bob', expiresAt },
    ]);

    await expect(service.logoutAll('alice-laptop')).resolves.toBeUndefined();
    expect(sessions).toEqual([
      { token: 'bob-laptop', userId: 'bob', expiresAt },
    ]);
  });

  it('does not delete sessions when logoutAll receives an unknown token', async () => {
    await service.logoutAll('unknown');
    expect(deleteMany).not.toHaveBeenCalled();
    expect(sessions).toHaveLength(3);
  });

  it.each([-1, 0])(
    'does not revoke other sessions when the token expires at now + %i ms',
    async (offset) => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      sessions[0].expiresAt = new Date(now + offset);

      await service.logoutAll('alice-laptop');

      expect(deleteMany).not.toHaveBeenCalled();
      expect(sessions).toHaveLength(3);
    },
  );

  it.each(['logout', 'logoutAll'] as const)(
    '%s propagates database failures',
    async (method) => {
      const error = new Error('Database unavailable');
      deleteMany.mockRejectedValueOnce(error);
      await expect(service[method]('alice-laptop')).rejects.toBe(error);
    },
  );
});
