import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PrismaService } from '../../core/config/prisma/prisma.service.js';
import * as argon2 from 'argon2';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserModel } from '../../generated/prisma/models/User.js';
import { randomBytes } from 'node:crypto';
import { CookieSessionService } from '../../core/config/session/cookie-session.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { SessionModel } from '../../generated/prisma/models/Session.js';
import { TSessionUser } from '../../core/types/session-user.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cookieSessionService: CookieSessionService,
  ) {}

  async create({
    name,
    email,
    password,
  }: CreateUserDto): Promise<Omit<UserModel, 'password'>> {
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
          name,
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

  async getSessionUser(sessionToken: string): Promise<{
    user: TSessionUser;
    newSession: Pick<SessionModel, 'token' | 'expiresAt'> | null;
  } | null> {
    const session = await this.prismaService.session.findUnique({
      where: { token: sessionToken },
      select: {
        expiresAt: true,
        user: {
          omit: { password: true },
        },
      },
    });
    const now = Date.now();

    if (!session || session.expiresAt.getTime() <= now) {
      return null;
    }

    const remainingSessionTime = session.expiresAt.getTime() - now;
    const shallBeRenewed =
      remainingSessionTime <=
      this.cookieSessionService.sessionDurationTime * 0.3;

    let newSession = null;

    if (shallBeRenewed) {
      const [updatedSession] =
        await this.prismaService.session.updateManyAndReturn({
          where: {
            token: sessionToken,
            expiresAt: { gt: new Date() },
          },
          data: {
            expiresAt: this.cookieSessionService.sessionExpiration,
          },
          select: {
            token: true,
            expiresAt: true,
          },
        });

      if (!updatedSession) {
        return null;
      }

      newSession = updatedSession;
    }

    return { user: session.user, newSession };
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

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }
}
