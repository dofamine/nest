import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import type { SessionUser } from '../models/session-user';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly user = inject(SessionStore).user;

  async loadUser(): Promise<SessionUser | null> {
    try {
      const user = await firstValueFrom(
        this.http.get<SessionUser>('/user/@me'),
      );
      this.user.set(user);
      return user;
    } catch (error) {
      this.user.set(null);
      if (error instanceof HttpErrorResponse && error.status === 401)
        return null;
      throw error;
    }
  }

  async login(email: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post(
        '/user/login',
        { email, password },
        { responseType: 'text' },
      ),
    );
    await this.loadUser();
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
    this.user.set(null);
  }

  invite(email: string) {
    // Nest returns the invitation ID as plain text.
    return firstValueFrom(
      this.http.post('/user/invite', { email }, { responseType: 'text' }),
    );
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
