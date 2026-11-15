import { createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { BadRequestException, Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mailer } from '@nestjs/mail';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import type { SessionService } from '../../core/configs/session/session.service.js';
import { UserService } from './user.service.js';

describe('UserService password reset', () => {
  const user = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
  };

  let resetToken:
    | {
        id: string;
        tokenHash: string;
        userId: string;
        expiresAt: Date;
      }
    | undefined;
  let passwordHash: string | undefined;
  let sessionsDeleted: boolean;
  let send: ReturnType<typeof vi.fn>;
  let service: UserService;
  let canConsumeToken: boolean;

  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    resetToken = undefined;
    passwordHash = undefined;
    sessionsDeleted = false;
    canConsumeToken = true;
    send = vi.fn().mockResolvedValue(undefined);

    const passwordResetToken = {
      upsert: vi.fn(async ({ update, create }) => {
        resetToken = {
          id: resetToken?.id ?? 'reset-1',
          tokenHash: resetToken ? update.tokenHash : create.tokenHash,
          userId: user.id,
          expiresAt: resetToken ? update.expiresAt : create.expiresAt,
        };

        return resetToken;
      }),
      findUnique: vi.fn(async ({ where }) =>
        resetToken?.tokenHash === where.tokenHash ? resetToken : null,
      ),
      deleteMany: vi.fn(async ({ where }) => {
        if (!canConsumeToken) return { count: 0 };

        const matches =
          resetToken &&
          (!where.id || resetToken.id === where.id) &&
          (!where.userId || resetToken.userId === where.userId) &&
          (!where.tokenHash || resetToken.tokenHash === where.tokenHash) &&
          (!where.expiresAt?.gt ||
            resetToken.expiresAt.getTime() > where.expiresAt.gt.getTime());

        if (!matches) return { count: 0 };

        resetToken = undefined;
        return { count: 1 };
      }),
    };

    const prisma = {
      user: {
        findUnique: vi.fn(async ({ where }) =>
          where.email === user.email ? user : null,
        ),
        update: vi.fn(async ({ data }) => {
          passwordHash = data.password;
          return user;
        }),
      },
      session: {
        deleteMany: vi.fn(async () => {
          sessionsDeleted = true;
          return { count: 2 };
        }),
      },
      passwordResetToken,
      $transaction: vi.fn(async (callback) =>
        callback({
          user: {
            update: vi.fn(async ({ data }) => {
              passwordHash = data.password;
              return user;
            }),
          },
          session: {
            deleteMany: vi.fn(async () => {
              sessionsDeleted = true;
              return { count: 2 };
            }),
          },
          passwordResetToken,
        }),
      ),
    };

    service = new UserService(
      prisma as unknown as PrismaService,
      {} as SessionService,
      { send } as unknown as Mailer,
      {
        getOrThrow: vi.fn().mockReturnValue('https://app.example.com'),
      } as unknown as ConfigService,
    );
  });

  it('stores only a hash and sends the raw token in the reset URL', async () => {
    await service.requestPasswordReset({ email: user.email });

    const mailOptions = send.mock.calls[0][1];
    const resetUrl = new URL(mailOptions.data.resetUrl);
    const rawToken = resetUrl.searchParams.get('token');

    expect(rawToken).toBeTruthy();
    expect(resetToken?.tokenHash).toBe(
      createHash('sha256').update(rawToken!).digest('hex'),
    );
    expect(resetToken?.tokenHash).not.toBe(rawToken);
  });

  it('does nothing observable when the email is unknown', async () => {
    await expect(
      service.requestPasswordReset({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
    expect(resetToken).toBeUndefined();
  });

  it('removes an unusable token without exposing mail failure', async () => {
    send.mockRejectedValueOnce(new Error('Mail unavailable'));

    await expect(
      service.requestPasswordReset({ email: user.email }),
    ).resolves.toBeUndefined();

    expect(resetToken).toBeUndefined();
  });

  it('resets the password, consumes the token, and revokes sessions', async () => {
    await service.requestPasswordReset({ email: user.email });
    const resetUrl = new URL(send.mock.calls[0][1].data.resetUrl);
    const rawToken = resetUrl.searchParams.get('token')!;

    await service.resetPassword({
      token: rawToken,
      newPassword: 'new-password',
    });

    expect(resetToken).toBeUndefined();
    expect(sessionsDeleted).toBe(true);
    expect(passwordHash).toBeDefined();
    await expect(argon2.verify(passwordHash!, 'new-password')).resolves.toBe(
      true,
    );

    await expect(
      service.resetPassword({
        token: rawToken,
        newPassword: 'another-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired token', async () => {
    await service.requestPasswordReset({ email: user.email });
    const resetUrl = new URL(send.mock.calls[0][1].data.resetUrl);
    const rawToken = resetUrl.searchParams.get('token')!;
    resetToken!.expiresAt = new Date(Date.now() - 1);

    await expect(
      service.resetPassword({ token: rawToken, newPassword: 'new-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(passwordHash).toBeUndefined();
    expect(sessionsDeleted).toBe(false);
  });

  it('rejects a token consumed concurrently before changing the password', async () => {
    await service.requestPasswordReset({ email: user.email });
    const resetUrl = new URL(send.mock.calls[0][1].data.resetUrl);
    const rawToken = resetUrl.searchParams.get('token')!;
    canConsumeToken = false;

    await expect(
      service.resetPassword({ token: rawToken, newPassword: 'new-password' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(passwordHash).toBeUndefined();
    expect(sessionsDeleted).toBe(false);
  });
});
