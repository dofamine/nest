import { NotificationService } from '../../../core/services/notification.service';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { errorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-user-menu',
  imports: [MenuModule, ButtonModule, TagModule],
  templateUrl: './user-menu.component.html',
})
export class UserMenuComponent {
  readonly loading = signal(false);
  readonly menu = computed<MenuItem[]>(() => [
    {
      label: 'My profile',
      icon: 'pi pi-user',
      routerLink: '/profile',
      disabled: this.loading(),
    },
    { separator: true },
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => void this.logout(),
      disabled: this.loading(),
    },
    {
      label: 'Log out from everywhere',
      icon: 'pi pi-desktop',
      command: () => void this.logout(true),
      disabled: this.loading(),
    },
  ]);

  constructor(
    readonly users: UserService,
    private readonly notifications: NotificationService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  async logout(all = false): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);

    try {
      await this.auth.logout(all);
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.notifications.error(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
