import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { SessionModule } from '../../core/config/session/session.module.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from '../../core/guards/auth/auth.guard.js';

@Module({
  imports: [
    SessionModule,
    ThrottlerModule.forRoot([{ ttl: 30_000, limit: 5 }]),
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard],
})
export class UserModule {}
