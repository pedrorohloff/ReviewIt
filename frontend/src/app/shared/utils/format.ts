import { DeliveryChannel, NotificationType } from '@app/core/models/notification';
import {
  ContentType,
  Genre,
  NotifyChannel,
} from '@app/core/models/post';
import { AccountStatus, Role } from '@app/core/models/profile';
import { ModerationActionType, ReportStatus } from '@app/core/models/report';

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  Book: 'Livro',
  Movie: 'Filme',
  Album: 'Álbum',
  Game: 'Jogo',
};

export const GENRE_LABELS: Record<Genre, string> = {
  Action: 'Ação',
  Romance: 'Romance',
  Horror: 'Terror',
  Comedy: 'Comédia',
  Drama: 'Drama',
};

export const NOTIFY_CHANNEL_LABELS: Record<NotifyChannel, string> = {
  None: 'Nenhum',
  'In-App': 'No app',
  Email: 'E-mail',
  Both: 'Ambos',
};

export const ROLE_LABELS: Record<Role, string> = {
  Regular: 'Regular',
  Moderator: 'Moderador',
  Admin: 'Admin',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  Active: 'Ativo',
  Inactive: 'Inativo',
  Suspended: 'Suspenso',
  Banned: 'Banido',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  'New Comment': 'Novo comentário',
  'Like Milestone': 'Marco de curtidas',
};

export const DELIVERY_CHANNEL_LABELS: Record<DeliveryChannel, string> = {
  'In-App': 'No app',
  Email: 'E-mail',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  Pending: 'Pendente',
  Resolved: 'Resolvida',
};

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  Remove: 'Remover',
  Warn: 'Advertir',
  Suspend: 'Suspender',
  Ban: 'Banir',
};

export function contentTypeLabel(type: ContentType): string {
  return CONTENT_TYPE_LABELS[type];
}

export function genreLabel(genre: Genre): string {
  return GENRE_LABELS[genre];
}

export function getInitials(name: string, maxLetters = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  const initials = parts.slice(0, maxLetters).map((part) => part.charAt(0));
  return initials.join('').toLocaleUpperCase('pt-BR');
}

export function reviewCountLabel(total: number): string {
  return `${total} ${total === 1 ? 'review' : 'reviews'}`;
}

/** Compact pt-BR numbers: 1.2 mil, 15,4 mil, 2 mi. */
export function numberShort(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function absoluteDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function longDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function dateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * pt-BR relative time used by cards and comments.
 * Dates older than seven days fall back to a short absolute date.
 */
export function relativeTime(value: string | Date, now: Date = new Date()): string {
  const date = toDate(value);

  if (!date) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return 'agora';
  }

  if (minutes < 60) {
    return `há ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `há ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `há ${days} d`;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
