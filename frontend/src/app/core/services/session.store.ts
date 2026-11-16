import { Injectable, signal } from '@angular/core';
import type { SessionUser } from '../models/session-user';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly user = signal<SessionUser | null>(null);
}
