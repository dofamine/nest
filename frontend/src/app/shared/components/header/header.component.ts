import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/services/session.store';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, UserMenuComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly session = inject(SessionStore);
}
