import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { EUserStatus, type IUser, UserModel } from '../models/user';
import { IInvitation } from '../models/invitation.model';

// Provided by the admin Users page, never by the root injector.
@Injectable()
export class AdminService {
  private readonly http = inject(HttpClient);

  invite(email: string): Promise<string> {
    return firstValueFrom(
      this.http.post('/admin/invite', { email }, { responseType: 'text' }),
    );
  }

  getUsers(): Promise<IUser[]> {
    return firstValueFrom(
      this.http
        .get<IUser[]>('/admin/users')
        .pipe(map((users) => users.map((user) => new UserModel(user)))),
    );
  }

  getInvitationLinkByMail(email: string): Promise<{ url: string }> {
    return firstValueFrom(
      this.http.get<{ url: string }>(
        `/admin/invitations/${encodeURIComponent(email)}/link`,
      ),
    );
  }

  updateUser(
    id: string,
    changes: {
      role?: IUser['role'];
      status?: EUserStatus.active | EUserStatus.deactivated;
    },
  ) {
    return firstValueFrom(this.http.patch(`/admin/${id}`, changes));
  }

  deleteUser(user: IUser): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/admin/user/${user.id}`));
  }

  deleteInvitation(email: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`/admin/invitations/${encodeURIComponent(email)}`),
    );
  }

  async getInvitedUsers(): Promise<IInvitation[]> {
    return firstValueFrom(this.http.get<IInvitation[]>('/admin/invitations/'));
  }
}
