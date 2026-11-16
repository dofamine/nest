import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../../core/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { AdminService } from './admin.service.js';
import { ManageUserDto } from './dto/manage-user.dto.js';
import { SessionUser } from '../../core/decorators/session-user.decorator.js';
import type { TSessionUser } from '../../shared/types/session-user.js';
import { InviteUserDto } from './dto/invite-user.dto.js';

@Roles([Role.admin])
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('invitations')
  getInvitations() {
    return this.adminService.getInvitations();
  }

  @Get('invitations/:invitationId/link')
  invitationLink(@Param('invitationId') invitationId: string) {
    return this.adminService.invitationLink(invitationId);
  }

  @Delete('invitations/:invitationId')
  deleteInvitation(@Param('invitationId') invitationId: string) {
    return this.adminService.deleteInvitation(invitationId);
  }

  @Patch(':id')
  manageUser(
    @Param('id') id: string,
    @Body() body: ManageUserDto,
    @SessionUser() actor: TSessionUser,
  ) {
    return this.adminService.manageUser(id, body, actor);
  }

  @Delete('user/:id')
  deleteUser(@Param('id') id: string, @SessionUser() actor: TSessionUser) {
    return this.adminService.deleteUser(id, actor);
  }

  @HttpCode(HttpStatus.CREATED)
  @Roles([Role.admin])
  @Post('invite')
  inviteUser(
    @Body() payload: InviteUserDto,
    @SessionUser() user: TSessionUser,
  ) {
    return this.adminService.inviteUser(payload, user);
  }
}
