import { ButtonModule } from 'primeng/button';
import { ThemeService } from '../../../core/services/theme.service';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionStore } from '../../../core/services/session.store';
import { UserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, UserMenuComponent, ButtonModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  constructor(
    readonly session: SessionStore,
    readonly theme: ThemeService,
  ) {}
}
