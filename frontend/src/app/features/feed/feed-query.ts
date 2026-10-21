import { ParamMap, Params } from '@angular/router';
import { ContentType, FeedFilters, Genre, SortOption } from '@app/core/models/post';

export const CONTENT_TYPES: readonly ContentType[] = ['Book', 'Movie', 'Album', 'Game'];
export const GENRES: readonly Genre[] = ['Action', 'Romance', 'Horror', 'Comedy', 'Drama'];
export const SORT_OPTIONS: readonly SortOption[] = ['recent', 'popular'];

export const DEFAULT_FEED_FILTERS: FeedFilters = { q: '', sort: 'recent' };

/**
 * Reads the feed filters from the URL. Unknown or invalid enum values fall
 * back to the default so a hand-edited deep link never crashes the feed.
 */
export function parseFeedQuery(params: ParamMap): FeedFilters {
  const q = params.get('q')?.trim() ?? '';
  const type = params.get('type');
  const genre = params.get('genre');
  const sort = params.get('sort');

  const filters: FeedFilters = { q, sort: isSortOption(sort) ? sort : 'recent' };

  if (isContentType(type)) {
    filters.contentType = type;
  }
  if (isGenre(genre)) {
    filters.genre = genre;
  }

  return filters;
}

/** Serializes only the meaningful filters so URLs stay short and canonical. */
export function feedFiltersToQuery(filters: FeedFilters): Params {
  const params: Params = {};

  if (filters.q.trim()) {
    params['q'] = filters.q.trim();
  }
  if (filters.contentType) {
    params['type'] = filters.contentType;
  }
  if (filters.genre) {
    params['genre'] = filters.genre;
  }
  if (filters.sort !== 'recent') {
    params['sort'] = filters.sort;
  }

  return params;
}

export function isContentType(value: string | null | undefined): value is ContentType {
  return value !== null && value !== undefined && CONTENT_TYPES.includes(value as ContentType);
}

export function isGenre(value: string | null | undefined): value is Genre {
  return value !== null && value !== undefined && GENRES.includes(value as Genre);
}

export function isSortOption(value: string | null | undefined): value is SortOption {
  return value !== null && value !== undefined && SORT_OPTIONS.includes(value as SortOption);
}

/** Stable identity used to cache a feed page between navigations. */
export function feedFiltersKey(filters: FeedFilters): string {
  return [filters.q.trim(), filters.contentType ?? '', filters.genre ?? '', filters.sort].join(
    '|',
  );
}

export function feedFiltersEqual(left: FeedFilters, right: FeedFilters): boolean {
  return feedFiltersKey(left) === feedFiltersKey(right);
}
