import type { Routes } from '@angular/router';
import { EAuthPageMode } from '../pages/auth/config';

// Public routes remain accessible without a session, including emailed links.
const authPage = () =>
  import('../pages/auth/auth.page').then((m) => m.AuthPage);

export const publicRoutes: Routes = [
  {
    path: 'login',
    loadComponent: authPage,
    data: { mode: EAuthPageMode.login },
    title: 'Sign in · Logo Portal',
  },
  {
    path: 'invite/:invitationId',
    loadComponent: authPage,
    data: { mode: EAuthPageMode.register },
    title: 'Accept invitation · Logo Portal',
  },
  {
    path: 'forgot-password',
    loadComponent: authPage,
    data: { mode: EAuthPageMode.forgot },
    title: 'Recover access · Logo Portal',
  },
  {
    path: 'reset-password',
    loadComponent: authPage,
    data: { mode: EAuthPageMode.reset },
    title: 'Reset password · Logo Portal',
  },
];
