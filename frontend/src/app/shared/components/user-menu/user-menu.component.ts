import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ApiService } from '../../../core/services/api.service';
import { errorMessage } from '../../../core/utils/error-message';

@Component({
  selector: 'app-user-menu',
  imports: [MenuModule, ButtonModule, TagModule, MessageModule],
  templateUrl: './user-menu.component.html',
})
export class UserMenuComponent {
  readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly menu = computed<MenuItem[]>(() => [
    {
      label: 'My profile',
      icon: 'pi pi-user',
      routerLink: '/profile',
      disabled: this.busy(),
    },
    { separator: true },
    {
      label: 'Log out',
      icon: 'pi pi-sign-out',
      command: () => void this.logout(),
      disabled: this.busy(),
    },
    {
      label: 'Log out from everywhere',
      icon: 'pi pi-desktop',
      command: () => void this.logout(true),
      disabled: this.busy(),
    },
  ]);

  async logout(all = false): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.logout(all);
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
