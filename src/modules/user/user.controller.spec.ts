import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionService } from '../../core/configs/session/session.service.js';
import { IS_PUBLIC_KEY } from '../../core/decorators/public.decorator.js';
import type { TSessionUser } from '../../shared/types/session-user.js';
import { UserController } from './user.controller.js';
import type { UserService } from './user.service.js';

describe('UserController', () => {
  let userService: {
    create: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    logoutAll: ReturnType<typeof vi.fn>;
    inviteUser: ReturnType<typeof vi.fn>;
    requestPasswordReset: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let sessionService: {
    getSession: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    deleteSession: ReturnType<typeof vi.fn>;
  };
  let controller: UserController;
  const response = {} as Response;
  const request = {} as Request;

  beforeEach(() => {
    userService = {
      create: vi.fn(),
      login: vi.fn().mockResolvedValue({
        token: 'session-token',
        expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      }),
      logout: vi.fn().mockResolvedValue(true),
      logoutAll: vi.fn().mockResolvedValue(undefined),
      inviteUser: vi.fn(),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
      resetPassword: vi.fn().mockResolvedValue(undefined),
    };
    sessionService = {
      getSession: vi.fn().mockReturnValue('session-token'),
      setSession: vi.fn(),
      deleteSession: vi.fn(),
    };
    controller = new UserController(
      userService as unknown as UserService,
      sessionService as unknown as SessionService,
    );
  });

  it('delegates registration and invitation payloads', async () => {
    const registration = {
      email: 'alice@example.com',
      password: 'password',
      invitationId: 'invite-1',
    };
    const invitation = { email: 'bob@example.com' };
    const user = {
      id: 'user-1',
      email: 'alice@example.com',
    } as TSessionUser;

    userService.create.mockResolvedValueOnce({ id: 'user-1' });
    userService.inviteUser.mockResolvedValueOnce('invite-2');

    await expect(controller.create(registration)).resolves.toEqual({
      id: 'user-1',
    });
    await expect(controller.inviteUser(invitation, user)).resolves.toBe(
      'invite-2',
    );
    expect(userService.create).toHaveBeenCalledWith(registration);
    expect(userService.inviteUser).toHaveBeenCalledWith(invitation, user);
  });

  it('sets the returned session as a cookie on login', async () => {
    const payload = { email: 'alice@example.com', password: 'password' };

    await controller.login(payload, response);

    expect(userService.login).toHaveBeenCalledWith(payload);
    expect(sessionService.setSession).toHaveBeenCalledWith(
      response,
      'session-token',
      new Date('2030-01-01T00:00:00.000Z'),
    );
  });

  it('deletes the current session and always clears its cookie on logout', async () => {
    await controller.logout(response, request);

    expect(userService.logout).toHaveBeenCalledWith('session-token');
    expect(sessionService.deleteSession).toHaveBeenCalledWith(response);

    sessionService.getSession.mockReturnValueOnce(undefined);
    await controller.logout(response, request);
    expect(userService.logout).toHaveBeenCalledTimes(1);
    expect(sessionService.deleteSession).toHaveBeenCalledTimes(2);
  });

  it('revokes all sessions associated with the current session', async () => {
    const user = {
      id: 'user-1',
      email: 'alice@example.com',
    } as TSessionUser;

    await controller.logoutAll(response, user);

    expect(userService.logoutAll).toHaveBeenCalledWith(user);
    expect(sessionService.deleteSession).toHaveBeenCalledWith(response);
  });

  it('returns generic password reset responses', async () => {
    await expect(
      controller.forgotPassword({ email: 'alice@example.com' }),
    ).resolves.toEqual({
      message: 'If the account exists, a password reset email has been sent',
    });
    await expect(
      controller.resetPassword({ token: 'token', newPassword: 'password' }),
    ).resolves.toEqual({ message: 'Password has been reset' });
  });

  it('returns the authenticated user unchanged', () => {
    const user = {
      id: 'user-1',
      email: 'alice@example.com',
    } as TSessionUser;

    expect(controller.getMe(user)).toBe(user);
  });

  it.each(['create', 'login', 'logout', 'forgotPassword', 'resetPassword'])(
    'marks %s as public',
    (method) => {
      expect(
        Reflect.getMetadata(
          IS_PUBLIC_KEY,
          UserController.prototype[method as keyof UserController],
        ),
      ).toBe(true);
    },
  );

  it.each(['logoutAll', 'getMe', 'inviteUser'])('protects %s', (method) => {
    expect(
      Reflect.getMetadata(
        IS_PUBLIC_KEY,
        UserController.prototype[method as keyof UserController],
      ),
    ).toBeUndefined();
  });
});
