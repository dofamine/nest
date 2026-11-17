import { Component, computed, input, output, signal } from '@angular/core';
import {
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import type { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from 'primeng/select';
import {
  EUserRole,
  EUserStatus,
  type IUser,
} from '../../../../core/models/user';
import {
  type TUserAction,
  USER_ACTION_LABELS,
  USER_ACTION_MESSAGES,
  USER_ACTION_TITLES,
  USER_ROLE_OPTIONS,
} from './config';
import type { IUserActionRequest, IUserRoleForm } from './user-action.model';

@Component({
  selector: 'app-user-actions-menu',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    MenuModule,
    SelectModule,
  ],
  templateUrl: './user-actions-menu.component.html',
  styleUrl: '../../../../shared/styles/user-dialog.css',
})
export class UserActionsMenuComponent {
  // Presentation inputs and user intents.
  readonly user = input.required<IUser>();
  readonly disabled = input(false);
  readonly action = output<IUserActionRequest>();

  // Local dialog and typed form state.
  readonly activeActionType = signal<TUserAction | null>(null);
  readonly roleForm: FormGroup<IUserRoleForm>;
  readonly rolesOptions = USER_ROLE_OPTIONS;

  // dialog presentation.
  readonly actionTitle = computed(() => this.getActionTitle());
  readonly actionLabel = computed(() => this.getActionLabel());
  readonly actionMessage = computed(() => this.getActionMessage());

  // User's menu
  readonly menuItems = computed(() => this.getMenuItems());

  constructor(private readonly formBuilder: NonNullableFormBuilder) {
    this.roleForm = this.initializeRoleForm();
  }

  onMenuItemSelect(action: TUserAction): void {
    this.roleForm.reset({ role: this.user().role });
    this.activeActionType.set(action);
  }

  closeDialog(): void {
    this.activeActionType.set(null);
  }

  onConfirmAction(): void {
    const action = this.activeActionType();
    if (!action || this.roleForm.invalid) return;
    this.action.emit({
      action,
      payload:
        action === 'changeRole' ? this.roleForm.getRawValue().role : null,
    });
    this.activeActionType.set(null);
  }

  private initializeRoleForm(): FormGroup<IUserRoleForm> {
    return this.formBuilder.group({
      role: this.formBuilder.control<IUser['role']>(EUserRole.therapist),
    });
  }

  private getMenuItems(): MenuItem[] {
    const user = this.user();
    if (user.status !== EUserStatus.invited) {
      return this.getRegisteredMenuItems(user);
    } else {
      return this.getInvitedUserMenuItems();
    }
  }

  private getInvitedUserMenuItems(): MenuItem[] {
    return [
      {
        ...this.createMenuItem(
          'Delete invitation',
          'pi pi-trash',
          'deleteInvitation',
        ),
        styleClass: 'danger-menu-item',
      },
    ];
  }

  private getRegisteredMenuItems(user: IUser): MenuItem[] {
    const statusItem =
      user.status === EUserStatus.active ? 'deactivate' : 'activate';
    return [
      this.createMenuItem('Edit role', 'pi pi-user-edit', 'changeRole'),
      this.createMenuItem(
        USER_ACTION_LABELS[statusItem],
        'pi pi-ban',
        statusItem,
      ),
      {
        ...this.createMenuItem('Delete user', 'pi pi-trash', 'deleteUser'),
        styleClass: 'danger-menu-item',
      },
    ];
  }

  private createMenuItem(
    label: string,
    icon: string,
    action: TUserAction,
  ): MenuItem {
    return {
      label,
      icon,
      disabled: this.disabled(),
      command: () => this.onMenuItemSelect(action),
    };
  }

  private getActionTitle(): string {
    const action = this.activeActionType();
    return action ? USER_ACTION_TITLES[action] : '';
  }

  private getActionLabel(): string {
    const action = this.activeActionType();
    return action ? USER_ACTION_LABELS[action] : '';
  }

  private getActionMessage(): string {
    const action = this.activeActionType();
    return action ? USER_ACTION_MESSAGES[action] : '';
  }
}
