import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { ForgotPasswordMail } from '../../shared/notifications/forgot-password.mail.js';

@Module({
  controllers: [UserController],
  providers: [UserService, ForgotPasswordMail],
})
export class UserModule {}
