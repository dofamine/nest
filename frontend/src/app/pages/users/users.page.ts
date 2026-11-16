import { Component, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { errorMessage } from '../../core/utils/error-message';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-users-page',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './users.page.html',
})
export class UsersPage {
  readonly api = inject(ApiService);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly invited = signal('');
  readonly submitted = signal(false);
  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  async invite() {
    if (this.busy()) return;

    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    await this.perform(async () => {
      this.invited.set('');
      const email = this.form.controls.email.value.trim();
      await this.api.invite(email);
      this.invited.set(email);
      this.form.reset();
      this.submitted.set(false);
    });
  }

  private async perform(action: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
