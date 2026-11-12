import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TAuthRequest, TSessionUser } from '../../shared/types/session-user.js';

export const SessionUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TSessionUser => {
    const request = context.switchToHttp().getRequest<TAuthRequest>();

    if (!request.user) {
      throw new UnauthorizedException();
    }

    return request.user;
  },
);
