import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as argon2 from 'argon2';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserModel } from '../../generated/prisma/models/User.js';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { SessionModel } from '../../generated/prisma/models/Session.js';
import { TSessionUser } from '../../shared/types/session-user.js';
import { SessionService } from '../../core/configs/session/session.service.js';
import { PrismaService } from '../../core/configs/prisma/prisma.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cookieSessionService: SessionService,
  ) {}

  async create({
    email,
    password,
    invitationId,
  }: CreateUserDto): Promise<Omit<UserModel, 'password'>> {
    const invitation = await this.prismaService.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new ForbiddenException('Invitation not found');
    }

    if (invitation.email !== email) {
      throw new ForbiddenException(
        'Invitation has been registered on different email',
      );
    }

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    try {
      return await this.prismaService.user.create({
        data: {
          email,
          password: passwordHash,
        },
        omit: { password: true },
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
    const user = await this.prismaService.user.findUnique({
      where: { email },
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
        expiresAt: this.cookieSessionService.sessionExpiration,
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

  async logoutAll(sessionToken: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true, expiresAt: true },
      });

      if (!session || session.expiresAt.getTime() <= Date.now()) {
        return;
      }

      await tx.session.deleteMany({
        where: { userId: session.userId },
      });
    });
  }

  async inviteUser(
    payload: InviteUserDto,
    user: TSessionUser,
  ): Promise<string> {
    const [{ id }] = await this.prismaService.invitation.createManyAndReturn({
      data: {
        email: payload.email,
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    return id;
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
