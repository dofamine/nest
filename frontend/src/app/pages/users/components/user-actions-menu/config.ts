import { EUserRole, type IUser } from '../../../../core/models/user';

export type TUserAction =
  'changeRole' | 'deleteUser' | 'deactivate' | 'activate' | 'deleteInvitation';

export const USER_ROLE_OPTIONS = [
  { label: 'Admin', value: EUserRole.admin },
  { label: 'Therapist', value: EUserRole.therapist },
] satisfies { label: string; value: IUser['role'] }[];

export const USER_ACTION_TITLES = {
  changeRole: 'Edit role',
  deleteUser: 'Delete user',
  deleteInvitation: 'Delete invitation',
  deactivate: 'Deactivate user',
  activate: 'Reactivate user',
} satisfies Record<TUserAction, string>;

export const USER_ACTION_LABELS = {
  changeRole: 'Save',
  deleteInvitation: 'Delete Invitation',
  deleteUser: 'Delete User',
  deactivate: 'Deactivate',
  activate: 'Reactivate',
} satisfies Record<TUserAction, string>;

export const USER_ACTION_MESSAGES = {
  changeRole: '',
  deleteUser:
    'Permanently delete this user and their sessions? This cannot be undone.',
  deleteInvitation: 'Delete this invitation? Its link will stop working.',
  deactivate:
    'Deactivate this user? They will be signed out and unable to sign in.',
  activate: 'Allow this user to sign in again?',
} satisfies Record<TUserAction, string>;
