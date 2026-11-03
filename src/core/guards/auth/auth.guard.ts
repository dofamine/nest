import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CookieSessionService } from '../../config/session/cookie-session.service.js';
import { UserService } from '../../../modules/user/user.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessionService: CookieSessionService,
    private readonly users: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const token = this.sessionService.get(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const { user, newSession } = (await this.users.getSessionUser(token)) ?? {};

    if (!user) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    if (newSession) {
      this.sessionService.set(response, newSession.token, newSession.expiresAt);
    }

    request.user = user;

    return true;
  }
}
