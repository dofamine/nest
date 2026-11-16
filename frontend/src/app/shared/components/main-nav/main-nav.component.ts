import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionStore } from '../../../core/services/session.store';

@Component({
  selector: 'app-main-nav',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="main-nav" aria-label="Main navigation">
      <span class="eyebrow">WORKSPACE</span>
      <a
        routerLink="/"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
        ><i class="pi pi-home" aria-hidden="true"></i> Dashboard</a
      >
      @if (session.user()?.role === 'admin') {
        <a
          routerLink="/users"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          ><i class="pi pi-users" aria-hidden="true"></i> Users</a
        >
      }
      <a
        routerLink="/patients"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        ><i class="pi pi-heart" aria-hidden="true"></i> Patients</a
      >
    </nav>
  `,
})
export class MainNavComponent {
  readonly session = inject(SessionStore);
}
