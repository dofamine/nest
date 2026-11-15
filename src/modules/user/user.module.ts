import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';
import { ForgotPasswordMail } from '../../shared/notifications/forgot-password.mail.js';

@Module({
  controllers: [UserController],
  providers: [UserService, InvitationMail, ForgotPasswordMail],
})
export class UserModule {}
