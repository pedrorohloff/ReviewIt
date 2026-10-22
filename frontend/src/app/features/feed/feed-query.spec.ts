import { convertToParamMap } from '@angular/router';
import {
  DEFAULT_FEED_FILTERS,
  feedFiltersEqual,
  feedFiltersKey,
  feedFiltersToQuery,
  isContentType,
  isGenre,
  isSortOption,
  parseFeedQuery,
} from './feed-query';

describe('parseFeedQuery', () => {
  it('reads a complete deep link', () => {
    const filters = parseFeedQuery(
      convertToParamMap({ q: 'duna', type: 'Book', genre: 'Drama', sort: 'popular' }),
    );

    expect(filters).toEqual({
      q: 'duna',
      contentType: 'Book',
      genre: 'Drama',
      sort: 'popular',
    });
  });

  it('ignores invalid enum values and defaults the sort', () => {
    const filters = parseFeedQuery(
      convertToParamMap({ q: '   ', type: 'Banana', genre: 'Aventura', sort: 'aleatorio' }),
    );

    expect(filters).toEqual(DEFAULT_FEED_FILTERS);
  });

  it('returns a fresh default object for an empty link', () => {
    expect(parseFeedQuery(convertToParamMap({}))).toEqual(DEFAULT_FEED_FILTERS);
  });

  it('validates each enum independently', () => {
    expect(isContentType('Game')).toBe(true);
    expect(isContentType('Series')).toBe(true);
    expect(isContentType('game')).toBe(false);
    expect(isGenre('Horror')).toBe(true);
    expect(isGenre(null)).toBe(false);
    expect(isSortOption('popular')).toBe(true);
    expect(isSortOption('recentes')).toBe(false);
  });
});

describe('feedFiltersToQuery', () => {
  it('omits empty and default values to keep URLs canonical', () => {
    expect(feedFiltersToQuery({ q: '  ', sort: 'recent' })).toEqual({});
  });

  it('serializes type, genre and popular sort', () => {
    expect(
      feedFiltersToQuery({ q: 'duna', contentType: 'Movie', genre: 'Action', sort: 'popular' }),
    ).toEqual({ q: 'duna', type: 'Movie', genre: 'Action', sort: 'popular' });
  });

  it('round-trips through the URL', () => {
    const filters = { q: 'casa', contentType: 'Book', genre: 'Drama', sort: 'popular' } as const;
    const serialized = feedFiltersToQuery(filters);

    expect(parseFeedQuery(convertToParamMap(serialized))).toEqual(filters);
  });
});

describe('feed filter identity', () => {
  it('compares after trimming the query', () => {
    expect(feedFiltersKey({ q: ' duna ', sort: 'recent' })).toBe(
      feedFiltersKey({ q: 'duna', sort: 'recent' }),
    );
    expect(feedFiltersEqual({ q: 'duna', sort: 'recent' }, { q: 'casa', sort: 'recent' })).toBe(
      false,
    );
  });
});
