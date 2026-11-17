import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { SessionUser } from '../models/session-user';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);
  readonly user = this.session.user.asReadonly();

  async loadUser(): Promise<SessionUser | null> {
    try {
      const user = await firstValueFrom(
        this.http.get<SessionUser>('/user/@me'),
      );
      this.session.user.set(user);
      return user;
    } catch (error) {
      this.session.user.set(null);
      if (error instanceof HttpErrorResponse && error.status === 401)
        return null;
      throw error;
    }
  }
}
