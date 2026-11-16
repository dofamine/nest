import { Injectable } from '@nestjs/common';
import { type CookieOptions, type Request, type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import type { Session } from '../../../generated/prisma/client.js';

@Injectable()
export class SessionService {
  private readonly sessionCookieName = 'session';
  private readonly cookieOptions: CookieOptions;

  constructor(private readonly configService: ConfigService) {
    this.cookieOptions = {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }

  get sessionDurationTime(): number {
    return 1000 * 60 * 60 * 24; // 24h
  }

  get sessionAbsoluteDurationTime(): number {
    return 1000 * 60 * 60 * 24 * 6; // 6 days
  }

  getBrandNewExpirationDate(): Date {
    return new Date(Date.now() + this.sessionDurationTime);
  }

  isValid(session?: Pick<Session, 'createdAt' | 'expiresAt'>): boolean {
    if (!session) return false;

    return (
      !this.isAbsoluteExpired(session) &&
      session.expiresAt.getTime() > new Date().getTime()
    );
  }

  canBeRenewed(session: Pick<Session, 'createdAt' | 'expiresAt'>): boolean {
    if (!this.isValid(session)) return false;

    const expirationThreshold = 0.3; // 30% or less to expire
    const remainingTime = session.expiresAt.getTime() - Date.now();

    return remainingTime <= this.sessionDurationTime * expirationThreshold;
  }

  getRenewedExpiration(session: Pick<Session, 'createdAt'>): Date {
    return new Date(
      Math.min(
        this.getBrandNewExpirationDate().getTime(),
        session.createdAt.getTime() + this.sessionAbsoluteDurationTime,
      ),
    );
  }

  setSession(res: Response, token: string, expiresAt?: Date): void {
    res.cookie(this.sessionCookieName, token, {
      ...this.cookieOptions,
      expires: expiresAt ?? this.getBrandNewExpirationDate(),
    });
  }

  deleteSession(res: Response): void {
    res.clearCookie(this.sessionCookieName, this.cookieOptions);
  }

  getSession(req: Request): string | null {
    return typeof req.cookies?.[this.sessionCookieName] === 'string'
      ? req.cookies[this.sessionCookieName]
      : null;
  }

  private isAbsoluteExpired(session: Pick<Session, 'createdAt'>): boolean {
    return (
      Date.now() >=
      session.createdAt.getTime() + this.sessionAbsoluteDurationTime
    );
  }
}
