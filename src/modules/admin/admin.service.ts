import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { TSessionUser } from '../../shared/types/session-user.js';
import { Mailer } from '@nestjs/mail';
import { ConfigService } from '@nestjs/config';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';
import { ManageUserDto } from './dto/manage-user.dto.js';
import { InvitationModel } from '../../generated/prisma/models/Invitation.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async getUsers() {
    return this.prismaService.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        deactivatedAt: true,
      },
    });
  }

  async getInvitations(): Promise<InvitationModel[]> {
    return this.prismaService.invitation.findMany({
      where: { expiresAt: { gt: new Date() } },
    });
  }

  async inviteUser(
    payload: InviteUserDto,
    user: TSessionUser,
  ): Promise<string> {
    const email = payload.email.trim().toLowerCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    const invitation = await this.prismaService.invitation.upsert({
      where: { email },
      create: { email, userId: user.id, expiresAt },
      update: { expiresAt },
      select: { id: true },
    });

    try {
      const invitationUrl = `${this.frontendUrl.replace(/\/$/, '')}/invite/${invitation.id}`;
      await this.mailer.send(InvitationMail, {
        to: email,
        retry: { attempts: 2, backoff: () => '2s' },
        data: {
          invitationUrl,
        },
      });
    } catch (error) {
      this.logger.error(`Could not send invitation to ${email}`, error);

      // Keep the invitation/link valid; retrying refreshes expiry and resends mail.
      throw new ServiceUnavailableException(
        'The invitation email could not be sent. Please try again.',
      );
    }

    return invitation.id;
  }

  async deleteUser(id: string, actor: TSessionUser) {
    if (id === actor.id)
      throw new BadRequestException('You cannot delete your own account');

    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { email: true },
      });

      if (!user) throw new NotFoundException('User not found');

      await tx.invitation.deleteMany({ where: { email: user.email } });
      await tx.user.delete({ where: { id } });

      return { message: 'User deleted' };
    });
  }

  async manageUser(id: string, payload: ManageUserDto, actor: TSessionUser) {
    if (id === actor.id) {
      throw new BadRequestException(
        'You cannot change your own role or status',
      );
    }

    return this.prismaService.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!user) throw new NotFoundException('User not found');

      await tx.user.update({
        where: { id },
        data: {
          ...(payload.role ? { role: payload.role } : {}),
          ...(payload.status
            ? {
                deactivatedAt:
                  payload.status === 'deactivated' ? new Date() : null,
              }
            : {}),
        },
      });

      if (payload.status === 'deactivated') {
        await tx.session.deleteMany({ where: { userId: id } });
        await tx.passwordResetToken.deleteMany({ where: { userId: id } });
      }

      return { message: 'User updated' };
    });
  }

  async deleteInvitation(invitationId: string) {
    const result = await this.prismaService.invitation.deleteMany({
      where: { id: invitationId },
    });
    if (!result.count) throw new NotFoundException('Invitation not found');
    return { message: 'Invitation deleted' };
  }

  async invitationLink(invitationId: string) {
    const invitation = await this.prismaService.invitation.findUnique({
      where: { id: invitationId, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!invitation)
      throw new NotFoundException('Invitation is invalid or expired');
    return {
      url: `${this.frontendUrl.replace(/\/$/, '')}/invite/${encodeURIComponent(invitation.id)}`,
    };
  }
}
