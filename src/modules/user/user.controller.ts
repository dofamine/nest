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
import { InviteUserDto } from './dto/invite-user.dto.js';

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
  @Get('@me')
  getMe(@SessionUser() user: TSessionUser) {
    return user;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('invite')
  inviteUser(
    @Body() payload: InviteUserDto,
    @SessionUser() user: TSessionUser,
  ) {
    return this.userService.inviteUser(payload, user);
  }
}
