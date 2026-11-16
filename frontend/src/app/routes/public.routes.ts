import type { Routes } from '@angular/router';

// Public routes remain accessible without a session, including emailed links.
const authPage = () =>
  import('../pages/auth/auth.page').then((m) => m.AuthPage);

export const publicRoutes: Routes = [
  {
    path: 'login',
    loadComponent: authPage,
    data: { mode: 'login' },
    title: 'Sign in · Logo Portal',
  },
  {
    path: 'invite/:invitationId',
    loadComponent: authPage,
    data: { mode: 'register' },
    title: 'Accept invitation · Logo Portal',
  },
  {
    path: 'forgot-password',
    loadComponent: authPage,
    data: { mode: 'forgot' },
    title: 'Recover access · Logo Portal',
  },
  {
    path: 'reset-password',
    loadComponent: authPage,
    data: { mode: 'reset' },
    title: 'Reset password · Logo Portal',
  },
];
