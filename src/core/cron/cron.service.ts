import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../configs/prisma/prisma.service.js';

@Injectable()
export class CronService {
  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_WEEK, {
    name: 'session_cleanup',
    waitForCompletion: true,
  })
  sessionCleanUp(): void {
    void this.prismaService.session.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'reset_password_cleanup',
    waitForCompletion: true,
  })
  passwordResetToken(): void {
    void this.prismaService.passwordResetToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'invitation_cleanup',
    waitForCompletion: true,
  })
  invitationCleanUp(): void {
    void this.prismaService.invitation.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  }
}
