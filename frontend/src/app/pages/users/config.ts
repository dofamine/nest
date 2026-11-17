import { EUserStatus, IUser } from '../../core/models/user';

export const USER_STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: EUserStatus.active },
  { label: 'Deactivated', value: EUserStatus.deactivated },
  { label: 'Invited', value: EUserStatus.invited },
] satisfies { label: string; value: IUser['status'] | 'all' }[];
