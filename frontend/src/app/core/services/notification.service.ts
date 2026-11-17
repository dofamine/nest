import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly messages: MessageService) {}

  success(detail: string): void {
    this.messages.add({
      severity: 'success',
      summary: 'Success',
      detail,
      life: 5000,
    });
  }

  error(detail: string): void {
    this.messages.add({
      severity: 'error',
      summary: 'Error',
      detail,
      life: 8000,
    });
  }

  info(detail: string): void {
    this.messages.add({
      severity: 'info',
      summary: 'Information',
      detail,
      life: 6000,
    });
  }
}
