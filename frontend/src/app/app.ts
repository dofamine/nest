import { ToastModule } from 'primeng/toast';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastModule],
  template: `
    <p-toast
      position="bottom-left"
      [baseZIndex]="10000"
      [breakpoints]="{ '600px': { width: 'calc(100vw - 2rem)' } }"
    />
    <app-header />
    <main><router-outlet /></main>
    <app-footer />
  `,
})
export class App {}
