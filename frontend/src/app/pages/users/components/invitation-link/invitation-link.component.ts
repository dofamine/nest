import { NotificationService } from '../../../../core/services/notification.service';
import { Component, input, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import type { IUser } from '../../../../core/models/user';
import { AdminService } from '../../../../core/services/admin.service';
import { errorMessage } from '../../../../core/utils/error-message';

@Component({
  selector: 'app-invitation-link',
  imports: [ButtonModule, DialogModule, InputTextModule],
  templateUrl: './invitation-link.component.html',
  styleUrl: '../../../../shared/styles/user-dialog.css',
})
export class InvitationLinkComponent {
  readonly user = input.required<Pick<IUser, 'email'>>();
  readonly link = signal('');
  readonly copied = signal(false);

  constructor(
    private readonly notifications: NotificationService,
    private readonly adminService: AdminService,
  ) {}

  async getLink(): Promise<void> {
    try {
      const { url } = await this.adminService.getInvitationLinkByMail(
        this.user().email,
      );
      this.copied.set(false);

      this.link.set(url);
    } catch (error) {
      this.notifications.error(errorMessage(error));
    } finally {
    }
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
      this.copied.set(true);
      this.notifications.success('Invitation link copied.');
    } catch {
      this.notifications.info(
        'Select and copy the invitation link from the field.',
      );
    }
  }
}
