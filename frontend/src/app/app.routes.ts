import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · ReviewIt',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: AppShell,
    children: [
      {
        path: '',
        title: 'ReviewIt — reviews de quem entende',
        loadComponent: () => import('./features/feed/feed-page').then((m) => m.FeedPage),
      },
      {
        path: '403',
        title: 'Acesso negado · ReviewIt',
        loadComponent: () => import('./pages/forbidden-page').then((m) => m.ForbiddenPage),
      },
      {
        path: '**',
        title: 'Página não encontrada · ReviewIt',
        loadComponent: () => import('./pages/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
