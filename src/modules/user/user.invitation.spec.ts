import {
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Mailer } from '@nestjs/mail';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../generated/prisma/client.js';
import type { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import type { SessionService } from '../../core/configs/session/session.service.js';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';
import { UserService } from './user.service.js';

describe('UserService invitations', () => {
  let deleteExpired: ReturnType<typeof vi.fn>;
  let createInvitation: ReturnType<typeof vi.fn>;
  let cleanupInvitation: ReturnType<typeof vi.fn>;
  let send: ReturnType<typeof vi.fn>;
  let service: UserService;
  const now = new Date('2026-11-13T12:00:00.000Z');

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    deleteExpired = vi.fn().mockResolvedValue({ count: 0 });
    createInvitation = vi.fn().mockResolvedValue({ id: 'invite-1' });
    cleanupInvitation = vi.fn().mockResolvedValue({ count: 1 });
    send = vi.fn().mockResolvedValue(undefined);

    const tx = {
      invitation: {
        deleteMany: deleteExpired,
        create: createInvitation,
      },
    };
    const prisma = {
      invitation: { deleteMany: cleanupInvitation },
      $transaction: vi.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    service = new UserService(
      prisma as unknown as PrismaService,
      {} as SessionService,
      { send } as unknown as Mailer,
      {
        getOrThrow: vi.fn().mockReturnValue('https://app.example.com/'),
      } as unknown as ConfigService,
    );
  });

  it('replaces expired invitations and emails a seven-day invitation', async () => {
    await expect(
      service.inviteUser(
        { email: ' Alice@Example.COM ' },
        { id: 'admin-1', email: 'admin@example.com' },
      ),
    ).resolves.toBe('invite-1');

    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(deleteExpired).toHaveBeenCalledWith({
      where: {
        email: 'alice@example.com',
        expiresAt: { lte: now },
      },
    });
    expect(createInvitation).toHaveBeenCalledWith({
      data: {
        email: 'alice@example.com',
        userId: 'admin-1',
        expiresAt,
      },
      select: { id: true },
    });
    expect(send).toHaveBeenCalledWith(InvitationMail, {
      to: 'alice@example.com',
      retry: { attempts: 2, backoff: expect.any(Function) },
      data: {
        invitationUrl: 'https://app.example.com/invite/invite-1',
      },
    });
  });

  it('maps an existing active invitation to a conflict response', async () => {
    createInvitation.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      }),
    );

    await expect(
      service.inviteUser(
        { email: 'alice@example.com' },
        { id: 'admin-1', email: 'admin@example.com' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(send).not.toHaveBeenCalled();
  });

  it('removes the invitation and reports an unavailable service if mail fails', async () => {
    send.mockRejectedValueOnce(new Error('Mail unavailable'));

    await expect(
      service.inviteUser(
        { email: 'alice@example.com' },
        { id: 'admin-1', email: 'admin@example.com' },
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(cleanupInvitation).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
    });
  });
});
