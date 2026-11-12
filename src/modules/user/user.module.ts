import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';

@Module({
  controllers: [UserController],
  providers: [UserService, InvitationMail],
})
export class UserModule {}
