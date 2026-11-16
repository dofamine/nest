import { Component, effect, inject, signal, type OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ApiService } from '../../core/services/api.service';
import { errorMessage } from '../../core/utils/error-message';

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, CardModule, InputTextModule, MessageModule],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly form = inject(NonNullableFormBuilder).group({
    id: '',
    name: '',
    email: '',
    role: '',
    createdAt: '',
    updatedAt: '',
  });

  constructor() {
    effect(() => {
      const user = this.api.user();
      this.form.reset(user ? { ...user, name: user.name ?? '' } : {});
    });
  }

  async ngOnInit() {
    try {
      await this.api.loadUser();
    } catch (error) {
      this.error.set(errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
