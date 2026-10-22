import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { moderatorGuard } from './core/auth/moderator.guard';
import { onboardingGuard } from './core/auth/onboarding.guard';
import { unsavedChangesGuard } from './features/posts/unsaved-changes.guard';
import { AppShell } from './layout/app-shell/app-shell';
import { ErrorPage } from './pages/error-page';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · ReviewIt',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'onboarding',
    title: 'Complete seu perfil · ReviewIt',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding-page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    component: AppShell,
    canActivateChild: [onboardingGuard],
    children: [
      {
        path: '',
        title: 'ReviewIt — reviews de quem entende',
        loadComponent: () => import('./features/feed/feed-page').then((m) => m.FeedPage),
      },
      {
        path: 'posts/:id',
        title: 'Review · ReviewIt',
        loadComponent: () =>
          import('./features/posts/post-detail-page').then((m) => m.PostDetailPage),
      },
      {
        path: 'new',
        title: 'Nova review · ReviewIt',
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/posts/post-editor-page').then((m) => m.PostEditorPage),
      },
      {
        path: 'posts/:id/edit',
        title: 'Editar review · ReviewIt',
        canActivate: [authGuard],
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () =>
          import('./features/posts/post-editor-page').then((m) => m.PostEditorPage),
      },
      {
        path: 'profile/:id',
        title: 'Perfil · ReviewIt',
        loadComponent: () =>
          import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'notifications',
        title: 'Notificações · ReviewIt',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/notifications/notifications-page').then((m) => m.NotificationsPage),
      },
      {
        path: 'moderation',
        title: 'Moderação · ReviewIt',
        canActivate: [authGuard, moderatorGuard],
        loadComponent: () =>
          import('./features/moderation/moderation-page').then((m) => m.ModerationPage),
      },
      {
        path: 'error',
        title: 'Erro · ReviewIt',
        component: ErrorPage,
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
