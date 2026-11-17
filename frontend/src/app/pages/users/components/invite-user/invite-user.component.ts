import type { IInvitationForm } from './invitation-form';
import { Component, input, output, signal } from '@angular/core';
import {
  type FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-invite-user',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './invite-user.component.html',
  styleUrl: '../../../../shared/styles/user-dialog.css',
})
export class InviteUserComponent {
  // Presentation inputs and user intents.
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly visible = signal(false);
  readonly invited = output<string>();

  // Local form state; application state belongs to the parent.
  readonly form: FormGroup<IInvitationForm>;

  constructor(private readonly formBuilder: NonNullableFormBuilder) {
    this.form = this.initializeInvitationForm();
  }

  openInvite(): void {
    if (this.disabled()) return;
    this.form.reset();
    this.visible.set(true);
  }

  submit(): void {
    if (this.disabled()) return;
    if (this.form.invalid) return;
    this.invited.emit(this.form.controls.email.value.trim().toLowerCase());
    this.visible.set(false);
  }

  private initializeInvitationForm(): FormGroup<IInvitationForm> {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }
}
