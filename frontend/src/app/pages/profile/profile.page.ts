import { NotificationService } from '../../core/services/notification.service';
import {
  Component,
  effect,
  Injector,
  signal,
  type OnInit,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { UserService } from '../../core/services/user.service';
import { errorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, CardModule, InputTextModule],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  readonly loading = signal(true);
  readonly form;

  constructor(
    readonly users: UserService,
    private readonly notifications: NotificationService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly injector: Injector,
  ) {
    this.form = this.initializeProfileForm();
  }

  private initializeProfileForm() {
    return this.formBuilder.group({
      id: '',
      name: '',
      email: '',
      role: '',
      createdAt: '',
      updatedAt: '',
    });
  }

  private observeProfileChanges(): void {
    effect(
      () => {
        const user = this.users.user();
        this.form.reset(user ? { ...user, name: user.name ?? '' } : {});
      },
      { injector: this.injector },
    );
  }

  async ngOnInit(): Promise<void> {
    this.observeProfileChanges();
    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.users.loadUser();
    } catch (error) {
      this.notifications.error(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
