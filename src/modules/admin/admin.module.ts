import { Module } from '@nestjs/common';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  controllers: [AdminController],
  providers: [AdminService, InvitationMail],
})
export class AdminModule {}
