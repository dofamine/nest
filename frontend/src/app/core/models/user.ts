export interface IUser {
  id: string;
  name: string;
  email: string;
  role: EUserRole;
  status: EUserStatus;
  createdAt: string | null;
  lastActiveAt: string | null;
  deactivatedAt: string | null;
}
export enum EUserStatus {
  active = 'active',
  deactivated = 'deactivated',
  invited = 'invited',
}

export enum EUserRole {
  admin = 'admin',
  therapist = 'therapist',
}

export class UserModel implements IUser {
  id: string = '';
  name: string = '';
  email: string = '';
  role: EUserRole = EUserRole.therapist;
  status: EUserStatus = EUserStatus.invited;
  createdAt: string | null = null;
  lastActiveAt: string | null = null;
  deactivatedAt: string | null = null;

  constructor(props?: Partial<IUser>) {
    if (props) {
      this.id = props.id ?? this.id;
      this.name = props.name ?? this.name;
      this.email = props.email ?? this.email;
      this.role = props.role ?? this.role;
      this.status = props.deactivatedAt
        ? EUserStatus.deactivated
        : props.createdAt
          ? EUserStatus.active
          : this.status;
      this.createdAt = props.createdAt ?? this.createdAt;
      this.lastActiveAt = props.lastActiveAt ?? this.lastActiveAt;
      this.deactivatedAt = props.deactivatedAt ?? this.deactivatedAt;
    }
  }
}
