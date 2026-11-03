import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { CookieSessionService } from '../../core/config/session/cookie-session.service.js';
import { type Request, type Response } from 'express';
import { AuthGuard } from '../../core/guards/auth/auth.guard.js';
import { SessionUser } from '../../core/decorators/session-user/session-user.decorator.js';
import type { TSessionUser } from '../../core/types/session-user.js';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: CookieSessionService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UseGuards(ThrottlerGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(ThrottlerGuard)
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, expiresAt } = await this.userService.login(loginUserDto);

    this.sessionService.set(res, token, expiresAt);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const sessionToken = this.sessionService.get(req);

    if (sessionToken) {
      await this.userService.logout(sessionToken);
    }

    this.sessionService.clear(res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  async logoutAll(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sessionToken = this.sessionService.get(req);

    if (sessionToken) {
      await this.userService.logoutAll(sessionToken);
    }

    this.sessionService.clear(res);
  }

  @HttpCode(HttpStatus.OK)
  @Get('status')
  @UseGuards(AuthGuard)
  getStatus() {
    return { isValid: true };
  }

  @HttpCode(HttpStatus.OK)
  @Get('@me')
  @UseGuards(AuthGuard)
  getMe(@SessionUser() user: TSessionUser) {
    return user;
  }
}
