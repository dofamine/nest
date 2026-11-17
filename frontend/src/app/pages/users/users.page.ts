import { UserService } from '../../core/services/user.service';
import { EUserStatus, IUser, UserModel } from '../../core/models/user';
import { USER_STATUS_OPTIONS } from './config';
import { NotificationService } from '../../core/services/notification.service';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, type OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminService } from '../../core/services/admin.service';
import { errorMessage } from '../../core/utils/error-message';
import { LastActivePipe } from '../../shared/pipes/last-active-pipe';
import { InviteUserComponent } from './components/invite-user/invite-user.component';
import { InvitationLinkComponent } from './components/invitation-link/invitation-link.component';
import { UserActionsMenuComponent } from './components/user-actions-menu/user-actions-menu.component';
import { IUserActionRequest } from './components/user-actions-menu/user-action.model';

@Component({
  selector: 'app-users-page',
  providers: [AdminService],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    LastActivePipe,
    InviteUserComponent,
    InvitationLinkComponent,
    UserActionsMenuComponent,
    UpperCasePipe,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.css',
})
export class UsersPage implements OnInit {
  readonly currentUser;

  readonly data = signal<Partial<IUser>[]>([]);
  readonly isDataLoading = signal(false);
  readonly isDataLoadingFailed = signal(false);

  // Invitation dialog and request state.
  readonly inviting = signal(false);

  readonly statuses = USER_STATUS_OPTIONS;
  readonly filtersForm;
  protected readonly EUserStatus = EUserStatus;
  private readonly filterValue;

  readonly filteredUsers = computed(() => {
    const { search = '', status = 'all' } = this.filterValue();
    const query = search.trim().toLowerCase();

    return this.data().filter(
      (user) =>
        (status === 'all' || user.status === status) &&
        `${user.name} ${user.email}`.toLowerCase().includes(query),
    );
  });

  constructor(
    private readonly notifications: NotificationService,
    private readonly adminService: AdminService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly userService: UserService,
  ) {
    this.currentUser = this.userService.user;
    this.filtersForm = this.initializeUserFilters();
    this.filterValue = toSignal(this.filtersForm.valueChanges, {
      initialValue: this.filtersForm.getRawValue(),
    });
  }

  async ngOnInit(): Promise<void> {
    await this.getUsers();
  }

  async getUsers(): Promise<void> {
    if (this.isDataLoading()) return;

    this.isDataLoading.set(true);
    this.isDataLoadingFailed.set(false);

    try {
      const [users, invitations] = await Promise.all([
        this.adminService.getUsers(),
        this.adminService.getInvitedUsers(),
      ]);
      const invitedUsers = invitations.map(
        (invitation) => new UserModel({ email: invitation.email }),
      );
      this.data.set([...users, ...invitedUsers]);
    } catch (error) {
      this.isDataLoadingFailed.set(true);
      this.notifications.error(errorMessage(error));
    } finally {
      this.isDataLoading.set(false);
    }
  }

  async onInviteUser(email: string): Promise<void> {
    this.inviting.set(true);

    try {
      await this.adminService.invite(email);
      this.notifications.success(
        `Invitation sent to ${email}. Use Get link to copy the invitation.`,
      );
      void this.getUsers();
    } catch (error) {
      this.notifications.error(errorMessage(error));
    } finally {
      this.inviting.set(false);
    }
  }

  protected async onAction(
    user: IUser,
    { action, payload }: IUserActionRequest,
  ): Promise<void> {
    let request: Promise<any>;

    switch (action) {
      case 'activate':
      case 'deactivate':
        request = this.adminService.updateUser(user.id, {
          status:
            action === 'activate'
              ? EUserStatus.active
              : EUserStatus.deactivated,
        });
        break;
      case 'changeRole':
        request = this.adminService.updateUser(user.id, {
          role: payload!,
        });
        break;
      case 'deleteInvitation':
        request = this.adminService.deleteInvitation(user.email);
        break;
      case 'deleteUser':
        request = this.adminService.deleteUser(user);
        break;
    }

    try {
      await request;
      void this.getUsers();
    } catch (error) {
      this.notifications.error(errorMessage(error));
    }
  }

  private initializeUserFilters() {
    return this.formBuilder.group({ search: '', status: 'all' });
  }
}
