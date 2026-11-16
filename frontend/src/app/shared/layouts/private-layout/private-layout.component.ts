import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNavComponent } from '../../components/main-nav/main-nav.component';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, MainNavComponent],
  template: `<div class="private-layout">
    <div class="page-content"><router-outlet /></div>
    <aside class="right-sidebar"><app-main-nav /></aside>
  </div>`,
})
export class PrivateLayoutComponent {}
