import {
  AUTH_PAGE_BUTTON_LABELS,
  AUTH_PAGE_DESCRIPTIONS,
  AUTH_PAGE_TITLES,
  EAuthPageMode,
} from './config';
import { NotificationService } from '../../core/services/notification.service';
import {
  Component,
  computed,
  effect,
  Injector,
  OnInit,
  signal,
} from '@angular/core';
import {
  type FormControl,
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
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
export class AuthPage implements OnInit {
  readonly loading = signal(false);
  readonly success = signal('');
  readonly submitted = signal(false);
  readonly form = computed(() => this.initializeAuthForm());
  readonly title = computed(() => AUTH_PAGE_TITLES[this.mode()]);
  readonly description = computed(() => AUTH_PAGE_DESCRIPTIONS[this.mode()]);
  readonly buttonLabel = computed(() => AUTH_PAGE_BUTTON_LABELS[this.mode()]);
  protected readonly EAuthPageMode = EAuthPageMode;
  private readonly routeData;
  readonly mode = computed(() => this.routeData()['mode'] as EAuthPageMode);
  private readonly routeParams;
  readonly token = computed(() => this.routeParams().get('token') ?? '');

  constructor(
    private readonly notifications: NotificationService,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly injector: Injector,
  ) {
    this.routeData = toSignal(this.route.data, {
      initialValue: this.route.snapshot.data,
    });
    this.routeParams = toSignal(this.route.queryParamMap, {
      initialValue: this.route.snapshot.queryParamMap,
    });
  }

  ngOnInit(): void {
    this.observeAuthNotifications();
  }

  async submit(): Promise<void> {
    if (this.loading()) return;

    const form = this.form();
    this.submitted.set(true);
    form.markAllAsTouched();
    if (form.invalid || (this.mode() === EAuthPageMode.reset && !this.token()))
      return;

    const { email, password } = form.getRawValue();
    this.loading.set(true);
    try {
      await this.authenticate(email.trim(), password);
      form.controls.password.reset();
      this.submitted.set(false);
    } catch (error) {
      this.notifications.error(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  private initializeAuthForm(): FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }> {
    return this.formBuilder.group({
      email: [
        { value: '', disabled: this.mode() === EAuthPageMode.reset },
        [Validators.required, Validators.email],
      ],
      password: [
        { value: '', disabled: this.mode() === EAuthPageMode.forgot },
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(255),
        ],
      ],
    });
  }

  private observeAuthNotifications(): void {
    effect(
      () => {
        const params = this.routeParams();
        if (params.has('unavailable')) {
          this.notifications.error(
            'Could not load your session. The server may be unavailable or rate limiting requests. Try again shortly.',
          );
        } else if (params.has('expired')) {
          this.notifications.info(
            'Your session has expired. Please sign in again.',
          );
        }
        if (this.mode() === EAuthPageMode.reset && !this.token()) {
          this.notifications.error(
            'This link is missing a reset token. Request a new reset email.',
          );
        }
      },
      { injector: this.injector },
    );
  }

  private showSuccess(message: string): void {
    this.success.set(message);
    this.notifications.success(message);
  }

  private async authenticate(email: string, password: string): Promise<void> {
    switch (this.mode()) {
      case EAuthPageMode.login:
        return this.signIn(email, password);
      case EAuthPageMode.register:
        return this.registerAccount(email, password);
      case EAuthPageMode.forgot:
        return this.requestPasswordReset(email);
      case EAuthPageMode.reset:
        return this.resetPassword(password);
    }
  }

  private async signIn(email: string, password: string): Promise<void> {
    await this.auth.login(email, password);
    await this.router.navigateByUrl('/');
  }

  private async registerAccount(
    email: string,
    password: string,
  ): Promise<void> {
    await this.auth.register(
      email,
      password,
      this.route.snapshot.paramMap.get('invitationId')!,
    );
    this.showSuccess('Your account is ready. Sign in to continue.');
  }

  private async requestPasswordReset(email: string): Promise<void> {
    const result = await this.auth.forgotPassword(email);
    this.showSuccess(result.message);
  }

  private async resetPassword(password: string): Promise<void> {
    await this.auth.resetPassword(this.token(), password);
    this.showSuccess('Password updated. Sign in with your new password.');
  }
}
