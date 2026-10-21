import { Routes } from '@angular/router';
import { AppShell } from './layout/app-shell/app-shell';

export const routes: Routes = [
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
        path: '**',
        title: 'Página não encontrada · ReviewIt',
        loadComponent: () => import('./pages/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
