import { Component, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { errorMessage } from '../../core/utils/error-message';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    MessageModule,
    PasswordModule,
  ],
  templateUrl: './auth.page.html',
})
export class AuthPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly mode = computed(
    () => this.data()['mode'] as 'login' | 'register' | 'forgot' | 'reset',
  );
  readonly token = computed(() => this.params().get('token') ?? '');
  readonly title = computed(
    () =>
      ({
        login: 'Welcome back.',
        register: 'Join your team.',
        forgot: 'Let’s get you back in.',
        reset: 'A fresh start.',
      })[this.mode()],
  );
  readonly description = computed(
    () =>
      ({
        login: 'Sign in to your workspace.',
        register: 'Use the email address your invitation was sent to.',
        forgot: 'We’ll send you a link to reset your password.',
        reset: 'Choose a new password for your account.',
      })[this.mode()],
  );
  readonly buttonLabel = computed(
    () =>
      ({
        login: 'Sign in',
        register: 'Create account',
        forgot: 'Send reset link',
        reset: 'Update password',
      })[this.mode()],
  );
  readonly busy = signal(false);
  readonly error = signal(
    this.route.snapshot.queryParamMap.has('unavailable')
      ? 'Could not load your session. The server may be unavailable or rate limiting requests. Try again shortly.'
      : this.route.snapshot.queryParamMap.has('expired')
        ? 'Your session has expired. Please sign in again.'
        : '',
  );
  readonly success = signal('');
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly submitted = signal(false);
  readonly form = computed(() =>
    this.formBuilder.group({
      email: [
        { value: '', disabled: this.mode() === 'reset' },
        [Validators.required, Validators.email],
      ],
      password: [
        { value: '', disabled: this.mode() === 'forgot' },
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(255),
        ],
      ],
    }),
  );

  async submit() {
    if (this.busy()) return;
    const form = this.form();
    this.submitted.set(true);
    form.markAllAsTouched();
    if (form.invalid || (this.mode() === 'reset' && !this.token())) return;
    const { email, password } = form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    try {
      switch (this.mode()) {
        case 'login':
          await this.api.login(email.trim(), password);
          await this.router.navigateByUrl('/');
          break;
        case 'register':
          await this.api.register(
            email.trim(),
            password,
            this.route.snapshot.paramMap.get('invitationId')!,
          );
          this.success.set('Your account is ready. Sign in to continue.');
          break;
        case 'forgot': {
          const result = await this.api.forgotPassword(email.trim());
          this.success.set(result.message);
          break;
        }
        case 'reset':
          await this.api.resetPassword(this.token(), password);
          this.success.set('Password updated. Sign in with your new password.');
      }
      form.controls.password.reset();
      this.submitted.set(false);
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
