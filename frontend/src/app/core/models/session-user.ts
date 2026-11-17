import { EUserRole } from './user';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: EUserRole;
  createdAt: string;
  updatedAt: string;
}
