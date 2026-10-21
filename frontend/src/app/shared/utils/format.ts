import { ContentType, Genre } from '@app/core/models/post';

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

/**
 * pt-BR relative time used by cards and comments.
 * Dates older than seven days fall back to a short absolute date.
 */
export function relativeTime(value: string | Date, now: Date = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
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
