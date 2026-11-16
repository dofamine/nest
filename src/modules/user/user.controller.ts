import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { type Request, type Response } from 'express';
import { SessionUser } from '../../core/decorators/session-user.decorator.js';
import type { TSessionUser } from '../../shared/types/session-user.js';
import { SessionService } from '../../core/configs/session/session.service.js';
import { Public } from '../../core/decorators/public.decorator.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, expiresAt } = await this.userService.login(loginUserDto);

    this.sessionService.setSession(res, token, expiresAt);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const sessionToken = this.sessionService.getSession(req);

    if (sessionToken) {
      await this.userService.logout(sessionToken);
    }

    this.sessionService.deleteSession(res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(
    @Res({ passthrough: true }) res: Response,
    @SessionUser() user: TSessionUser,
  ) {
    await this.userService.logoutAll(user);

    this.sessionService.deleteSession(res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('@me')
  getMe(@SessionUser() user: TSessionUser) {
    return user;
  }

  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('forgot-password')
  async forgotPassword(@Body() payload: ForgotPasswordDto) {
    await this.userService.requestPasswordReset(payload);

    return {
      message: 'If the account exists, a password reset email has been sent',
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() payload: ResetPasswordDto) {
    await this.userService.resetPassword(payload);

    return { message: 'Password has been reset' };
  }
}
