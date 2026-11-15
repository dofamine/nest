import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../configs/prisma/prisma.service.js';
import { CronService } from './cron.service.js';

describe('CronService', () => {
  let sessionDeleteMany: ReturnType<typeof vi.fn>;
  let resetDeleteMany: ReturnType<typeof vi.fn>;
  let invitationDeleteMany: ReturnType<typeof vi.fn>;
  let transaction: ReturnType<typeof vi.fn>;
  let service: CronService;

  beforeEach(() => {
    sessionDeleteMany = vi.fn().mockReturnValue('sessions-query');
    resetDeleteMany = vi.fn().mockReturnValue('reset-tokens-query');
    invitationDeleteMany = vi.fn().mockReturnValue('invitations-query');
    transaction = vi.fn().mockResolvedValue([]);

    service = new CronService({
      session: { deleteMany: sessionDeleteMany },
      passwordResetToken: { deleteMany: resetDeleteMany },
      invitation: { deleteMany: invitationDeleteMany },
      $transaction: transaction,
    } as unknown as PrismaService);
  });

  it('deletes all expired authentication records in one transaction', async () => {
    await service.sessionCleanUp();

    const sessionNow = sessionDeleteMany.mock.calls[0][0].where.expiresAt.lte;
    const resetNow = resetDeleteMany.mock.calls[0][0].where.expiresAt.lte;
    const invitationNow =
      invitationDeleteMany.mock.calls[0][0].where.expiresAt.lte;

    expect(sessionNow).toBeInstanceOf(Date);
    expect(resetNow).toBe(sessionNow);
    expect(invitationNow).toBe(sessionNow);
    expect(transaction).toHaveBeenCalledWith([
      'sessions-query',
      'reset-tokens-query',
      'invitations-query',
    ]);
  });

  it('propagates transaction failures', async () => {
    const error = new Error('Database unavailable');
    transaction.mockRejectedValueOnce(error);

    await expect(service.sessionCleanUp()).rejects.toBe(error);
  });
});
