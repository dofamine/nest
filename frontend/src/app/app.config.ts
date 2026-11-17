import { MessageService } from 'primeng/api';
import type { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import { LogoPortalPreset } from './core/theme/logo-portal.preset';

export const appConfig: ApplicationConfig = {
  providers: [
    MessageService,
    provideHttpClient(withInterceptors([sessionInterceptor])),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: LogoPortalPreset,
        options: { darkModeSelector: '.portal-dark' },
      },
    }),
  ],
};
