import { Injectable } from '@nestjs/common';
import { TSessionUser } from '../../../shared/types/session-user.js';
import { PrismaService } from '../../configs/prisma/prisma.service.js';
import { SessionService } from '../../configs/session/session.service.js';
import { SessionModel } from '../../../generated/prisma/models/Session.js';
import type { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sessionService: SessionService,
  ) {}

  async getSessionUser(
    req: Request,
    res: Response,
  ): Promise<TSessionUser | null> {
    const token = this.sessionService.get(req);

    if (!token) return null;

    const session = await this.prismaService.session.findUnique({
      where: { token, expiresAt: { gt: new Date() } },
      select: {
        expiresAt: true,
        token: true,
        user: {
          omit: { password: true },
        },
      },
    });

    if (!session) return null;

    void this.handleSessionExpiration(session, res);

    return session.user;
  }

  private async handleSessionExpiration(
    session: Pick<SessionModel, 'token' | 'expiresAt'>,
    res: Response,
  ): Promise<void> {
    const remainingTime = session.expiresAt.getTime() - Date.now();
    const shouldBeRenewed =
      remainingTime <= this.sessionService.sessionDurationTime * 0.3; // 30% or less to expire

    if (!shouldBeRenewed) return;

    const [updatedSession] =
      await this.prismaService.session.updateManyAndReturn({
        where: {
          token: session.token,
          expiresAt: { gt: new Date() },
        },
        data: {
          expiresAt: this.sessionService.sessionExpiration,
        },
        select: {
          token: true,
          expiresAt: true,
        },
      });

    if (!updatedSession) return;

    this.sessionService.set(
      res,
      updatedSession.token,
      updatedSession.expiresAt,
    );
  }
}
