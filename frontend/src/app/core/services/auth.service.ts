import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { SessionUser } from '../models/session-user';
import { SessionStore } from './session.store';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly session = inject(SessionStore);

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        '/user/login',
        { email, password },
        { responseType: 'text' },
      ),
    );
    await this.users.loadUser();
  }

  register(email: string, password: string, invitationId: string) {
    return firstValueFrom(
      this.http.post<SessionUser>('/user/register', {
        email,
        password,
        invitationId,
      }),
    );
  }

  async logout(all = false): Promise<void> {
    await firstValueFrom(
      this.http.post(
        all ? '/user/logout-all' : '/user/logout',
        {},
        { responseType: 'text' },
      ),
    );
    this.session.user.set(null);
  }

  forgotPassword(email: string) {
    return firstValueFrom(
      this.http.post<{ message: string }>('/user/forgot-password', { email }),
    );
  }

  resetPassword(token: string, newPassword: string) {
    return firstValueFrom(
      this.http.post('/user/reset-password', { token, newPassword }),
    );
  }
}
