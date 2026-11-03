import { Module } from '@nestjs/common';
import { CookieSessionService } from './cookie-session.service.js';

@Module({
  providers: [CookieSessionService],
  exports: [CookieSessionService],
})
export class SessionModule {}
