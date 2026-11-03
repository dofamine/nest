import { Injectable } from '@nestjs/common';
import { type CookieOptions, type Request, type Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CookieSessionService {
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

  get sessionExpiration(): Date {
    return new Date(Date.now() + this.sessionDurationTime);
  }

  get sessionDurationTime(): number {
    return 1000 * 60 * 60 * 24; // 24h
  }

  set(res: Response, token: string, expiresAt?: Date): void {
    res.cookie(this.sessionCookieName, token, {
      ...this.cookieOptions,
      expires: expiresAt ?? this.sessionExpiration,
    });
  }

  clear(res: Response): void {
    res.clearCookie(this.sessionCookieName, this.cookieOptions);
  }

  get(req: Request): string | null {
    return typeof req.cookies?.[this.sessionCookieName] === 'string'
      ? req.cookies[this.sessionCookieName]
      : null;
  }
}
