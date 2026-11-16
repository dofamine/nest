import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../configs/prisma/prisma.service.js';
import { CronService } from './cron.service.js';

describe('CronService', () => {
  let sessionDeleteMany: ReturnType<typeof vi.fn>;
  let resetDeleteMany: ReturnType<typeof vi.fn>;
  let invitationDeleteMany: ReturnType<typeof vi.fn>;
  let service: CronService;

  beforeEach(() => {
    sessionDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    resetDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
    invitationDeleteMany = vi.fn().mockResolvedValue({ count: 1 });

    service = new CronService({
      session: { deleteMany: sessionDeleteMany },
      passwordResetToken: { deleteMany: resetDeleteMany },
      invitation: { deleteMany: invitationDeleteMany },
    } as unknown as PrismaService);
  });

  it('starts deletion of expired sessions', () => {
    expect(service.sessionCleanUp()).toBeUndefined();

    expect(sessionDeleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: expect.any(Date) } },
    });
    expect(resetDeleteMany).not.toHaveBeenCalled();
    expect(invitationDeleteMany).not.toHaveBeenCalled();
  });

  it('starts deletion of expired password reset tokens', () => {
    expect(service.passwordResetToken()).toBeUndefined();

    expect(resetDeleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: expect.any(Date) } },
    });
    expect(sessionDeleteMany).not.toHaveBeenCalled();
    expect(invitationDeleteMany).not.toHaveBeenCalled();
  });

  it('starts deletion of expired invitations', () => {
    expect(service.invitationCleanUp()).toBeUndefined();
    expect(invitationDeleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: expect.any(Date) } },
    });
    expect(sessionDeleteMany).not.toHaveBeenCalled();
    expect(resetDeleteMany).not.toHaveBeenCalled();
  });
});
