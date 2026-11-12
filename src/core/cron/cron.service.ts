import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../configs/prisma/prisma.service.js';

@Injectable()
export class CronService {
  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_WEEK, { name: 'session_cleanup' })
  sessionCleanUp() {
    void this.prismaService.session.deleteMany({
      where: { expiresAt: { lte: new Date().toISOString() } },
    });
  }
}
