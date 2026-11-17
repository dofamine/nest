import type { FormControl } from '@angular/forms';
import type { IUser } from '../../../../core/models/user';
import type { TUserAction } from './config';

export interface IUserRoleForm {
  role: FormControl<IUser['role']>;
}

export interface IUserActionRequest {
  action: TUserAction;
  payload: IUser['role'] | null;
}
