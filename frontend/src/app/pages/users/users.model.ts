import { FormControl } from '@angular/forms';
import { IUser } from '../../core/models/user';

export interface IUserFiltersForm {
  search: FormControl<string>;
  user: FormControl<string>;
  role: FormControl<IUser['role'] | null>;
  status: FormControl<IUser['status'] | null>;
}

export interface IUserTableRow extends Partial<IUser> {
  displayName: string;
  identitySearch: string;
  createdAtSort: number | null;
  lastActiveAtSort: number | null;
}
