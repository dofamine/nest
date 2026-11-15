import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as argon2 from 'argon2';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserModel } from '../../generated/prisma/models/User.js';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { SessionModel } from '../../generated/prisma/models/Session.js';
import { TSessionUser } from '../../shared/types/session-user.js';
import { SessionService } from '../../core/configs/session/session.service.js';
import { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { Mailer } from '@nestjs/mail';
import { InvitationMail } from '../../shared/notifications/invitation.mail.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ForgotPasswordMail } from '../../shared/notifications/forgot-password.mail.js';
import { ConfigService } from '@nestjs/config';

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly cookieSessionService: SessionService,
    private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  async create({
    email,
    password,
    invitationId,
  }: CreateUserDto): Promise<Omit<UserModel, 'password'>> {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await this.hashPassword(password);

    try {
      return this.prismaService.$transaction(async (tx) => {
        const consumedInvitation = await tx.invitation.deleteMany({
          where: {
            id: invitationId,
            email: normalizedEmail,
            expiresAt: { gt: new Date() },
          },
        });

        if (consumedInvitation.count !== 1) {
          throw new ForbiddenException('Invitation is invalid');
        }

        return tx.user.create({
          data: {
            email: normalizedEmail,
            password: passwordHash,
          },
          omit: {
            password: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists');
      }

      throw error;
    }
  }

  async login({
    email,
    password,
  }: LoginUserDto): Promise<Pick<SessionModel, 'token' | 'expiresAt'>> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        password: true,
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await argon2.verify(user.password, password);

    if (!isValid) {
      throw new NotFoundException('User not found');
    }

    return this.prismaService.session.create({
      data: {
        token: this.generateToken(),
        userId: user.id,
        expiresAt: this.cookieSessionService.getBrandNewExpirationDate(),
      },
      select: {
        token: true,
        expiresAt: true,
      },
    });
  }

  async logout(sessionToken: string): Promise<boolean> {
    await this.prismaService.session.deleteMany({
      where: { token: sessionToken },
    });

    return true;
  }

  async logoutAll(user: TSessionUser): Promise<void> {
    await this.prismaService.session.deleteMany({
      where: { userId: user.id },
    });
  }

  // Introduce an outbox when reliable email delivery becomes important.
  // ----------------
  // Mail and database writes are not atomic.
  // If a provider accepts an invitation email but the request times out,
  // your catch block deletes the invitation and the delivered link becomes invalid.
  // For production reliability, use an outbox table and background worker with retry/status tracking.
  async inviteUser(
    payload: InviteUserDto,
    user: TSessionUser,
  ): Promise<string> {
    let invitation: { id: string };
    const email = payload.email.trim().toLowerCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    try {
      invitation = await this.prismaService.$transaction(async (tx) => {
        const existingInvitation = await tx.invitation.findUnique({
          where: { email, expiresAt: { lt: new Date() } },
          select: { id: true },
        });

        if (existingInvitation) return existingInvitation;

        return tx.invitation.create({
          data: {
            email,
            userId: user.id,
            expiresAt,
          },
          select: {
            id: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This email has already been invited');
      }

      throw error;
    }

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

      await this.prismaService.invitation.deleteMany({
        where: {
          id: invitation.id,
        },
      });

      throw new ServiceUnavailableException(
        'The invitation email could not be sent. Please try again.',
      );
    }

    return invitation.id;
  }

  async requestPasswordReset({ email }: ForgotPasswordDto): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    // Keep the response identical for registered and unregistered addresses.
    if (!user) return;

    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    await this.prismaService.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
      create: {
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        userId: user.id,
      },
    });

    const resetUrl = `${this.frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await this.mailer.send(ForgotPasswordMail, {
        to: user.email,
        retry: { attempts: 2, backoff: () => '2s' },
        data: {
          resetUrl,
          userName: user.name,
        },
      });
    } catch (error) {
      this.logger.error(
        `Could not send password reset email for user ${user.id}`,
        error,
      );

      try {
        await this.prismaService.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            tokenHash,
          },
        });
      } catch (cleanupError) {
        this.logger.error(
          `Could not remove undelivered password reset token for user ${user.id}`,
          cleanupError,
        );
      }
    }
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(token);
    const resetToken = await this.prismaService.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });

    if (!resetToken || resetToken.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Reset link is invalid or expired');
    }
    const passwordHash = await this.hashPassword(newPassword);

    await this.prismaService.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.deleteMany({
        where: {
          id: resetToken.id,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      });

      if (consumed.count !== 1) {
        throw new BadRequestException('Reset link is invalid or expired');
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash },
      });

      await tx.session.deleteMany({
        where: { userId: resetToken.userId },
      });
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }
}
