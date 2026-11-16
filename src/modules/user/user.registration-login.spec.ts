import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Mailer } from '@nestjs/mail';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import type { SessionService } from '../../core/configs/session/session.service.js';
import { UserService } from './user.service.js';

vi.mock('argon2', () => ({
  argon2id: 2,
  hash: vi.fn().mockResolvedValue('password-hash'),
  verify: vi.fn().mockResolvedValue(true),
}));

describe('UserService registration and login', () => {
  let invitationDeleteMany: ReturnType<typeof vi.fn>;
  let userCreate: ReturnType<typeof vi.fn>;
  let userFindUnique: ReturnType<typeof vi.fn>;
  let sessionCreate: ReturnType<typeof vi.fn>;
  let prisma: Record<string, unknown>;
  let service: UserService;
  const sessionExpiration = new Date('2030-01-01T00:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    invitationDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    userCreate = vi.fn().mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
    });
    userFindUnique = vi.fn().mockResolvedValue({
      id: 'user-1',
      password: 'stored-hash',
    });
    sessionCreate = vi.fn().mockResolvedValue({
      token: 'created-token',
      expiresAt: sessionExpiration,
    });

    const tx = {
      invitation: { deleteMany: invitationDeleteMany },
      user: { create: userCreate },
    };
    prisma = {
      user: { findUnique: userFindUnique },
      session: { create: sessionCreate },
      $transaction: vi.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    service = new UserService(
      prisma as unknown as PrismaService,
      {
        getBrandNewExpirationDate: vi.fn().mockReturnValue(sessionExpiration),
      } as unknown as SessionService,
      {} as Mailer,
      {
        getOrThrow: vi.fn().mockReturnValue('https://app.example.com'),
      } as unknown as ConfigService,
    );
  });

  it('atomically consumes a matching invitation and creates a normalized user', async () => {
    await expect(
      service.create({
        email: '  Alice@Example.COM ',
        password: 'secret-password',
        invitationId: 'invite-1',
      }),
    ).resolves.toEqual({ id: 'user-1', email: 'alice@example.com' });

    expect(argon2.hash).toHaveBeenCalledWith('secret-password', {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    expect(invitationDeleteMany).toHaveBeenCalledWith({
      where: {
        id: 'invite-1',
        email: 'alice@example.com',
        expiresAt: { gt: expect.any(Date) },
      },
    });
    expect(userCreate).toHaveBeenCalledWith({
      data: { email: 'alice@example.com', password: 'password-hash' },
      omit: { password: true },
    });
  });

  it('rejects an invalid or already consumed invitation before creating a user', async () => {
    invitationDeleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.create({
        email: 'alice@example.com',
        password: 'secret-password',
        invitationId: 'invalid',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userCreate).not.toHaveBeenCalled();
  });

  it('maps a unique-email race to a conflict response', async () => {
    userCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );

    await expect(
      service.create({
        email: 'alice@example.com',
        password: 'secret-password',
        invitationId: 'invite-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('normalizes credentials and creates a session after password verification', async () => {
    await expect(
      service.login({
        email: ' Alice@Example.COM ',
        password: 'secret-password',
      }),
    ).resolves.toEqual({
      token: 'created-token',
      expiresAt: sessionExpiration,
    });

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
      select: { password: true, id: true },
    });
    expect(argon2.verify).toHaveBeenCalledWith(
      'stored-hash',
      'secret-password',
    );
    expect(sessionCreate).toHaveBeenCalledWith({
      data: {
        token: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        userId: 'user-1',
        expiresAt: sessionExpiration,
      },
      select: { token: true, expiresAt: true },
    });
  });

  it('returns the same error for an unknown email and an invalid password', async () => {
    userFindUnique.mockResolvedValueOnce(null);
    await expect(
      service.login({ email: 'nobody@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(argon2.verify).not.toHaveBeenCalled();

    vi.mocked(argon2.verify).mockResolvedValueOnce(false);
    await expect(
      service.login({ email: 'alice@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(sessionCreate).not.toHaveBeenCalled();
  });
});
