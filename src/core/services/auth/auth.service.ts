import { Injectable } from '@nestjs/common';
import { TSessionUser } from '../../../shared/types/session-user.js';
import { PrismaService } from '../../configs/prisma/prisma.service.js';
import { SessionService } from '../../configs/session/session.service.js';
import { SessionModel } from '../../../generated/prisma/models/Session.js';
import type { Request, Response } from 'express';
import { UserModel } from '../../../generated/prisma/models/User.js';

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
    const token = this.sessionService.getSession(req);

    if (!token) return null;

    const session = await this.prismaService.session.findUnique({
      where: { token, expiresAt: { gt: new Date() } },
      select: {
        expiresAt: true,
        token: true,
        createdAt: true,
        user: {
          omit: { password: true },
        },
      },
    });

    if (
      !session ||
      session.user.deactivatedAt ||
      !this.sessionService.isValid(session)
    )
      return null;

    this.recordActivity(session.user);
    await this.handleSessionExpiration(session, res);

    return session.user;
  }

  // Record activity at most once per minute per user.
  private recordActivity(user: Omit<UserModel, 'password'>): void {
    const frequencyWindow = 60_000;

    if (
      !user.lastActiveAt ||
      Date.now() - user.lastActiveAt.getTime() > frequencyWindow
    ) {
      void this.prismaService.user.updateMany({
        where: {
          id: user.id,
          deactivatedAt: null,
        },
        data: { lastActiveAt: new Date() },
      });
    }
  }

  private async handleSessionExpiration(
    session: Pick<SessionModel, 'token' | 'expiresAt' | 'createdAt'>,
    res: Response,
  ): Promise<void> {
    const canBeRenewed = this.sessionService.canBeRenewed(session);

    if (!canBeRenewed) return;

    const [updatedSession] =
      await this.prismaService.session.updateManyAndReturn({
        where: {
          token: session.token,
          expiresAt: { gt: new Date() },
        },
        data: {
          expiresAt: this.sessionService.getRenewedExpiration(session),
        },
        select: {
          token: true,
          expiresAt: true,
        },
      });

    if (!updatedSession) return;

    this.sessionService.setSession(
      res,
      updatedSession.token,
      updatedSession.expiresAt,
    );
  }
}
