import type { Request } from 'express';
import { UserModel } from '../../generated/prisma/models/User.js';

export type TSessionUser = Omit<UserModel, 'password'>;

export type TAuthRequest = Request & {
  user?: TSessionUser;
};
