import type { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { adminGuard } from '../core/guards/admin.guard';

export const privateRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../shared/layouts/private-layout/private-layout.component').then(
        (m) => m.PrivateLayoutComponent,
      ),
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('../pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
        title: 'Your workspace · Logo Portal',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../pages/profile/profile.page').then((m) => m.ProfilePage),
        title: 'My profile · Logo Portal',
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('../pages/users/users.page').then((m) => m.UsersPage),
        title: 'Users · Logo Portal',
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('../pages/patients/patients.page').then((m) => m.PatientsPage),
        title: 'Patients · Logo Portal',
      },
    ],
  },
];
