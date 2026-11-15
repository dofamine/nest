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
        createdAt: true,
        user: {
          omit: { password: true },
        },
      },
    });

    if (!session || this.sessionService.isAbsoluteExpired(session)) return null;

    await this.handleSessionExpiration(session, res);

    return session.user;
  }

  private async handleSessionExpiration(
    session: Pick<SessionModel, 'token' | 'expiresAt' | 'createdAt'>,
    res: Response,
  ): Promise<void> {
    const shouldBeRenewed = this.sessionService.isRenewable(session);

    if (!shouldBeRenewed) return;

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

    this.sessionService.set(
      res,
      updatedSession.token,
      updatedSession.expiresAt,
    );
  }
}
