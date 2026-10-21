import {
  absoluteDate,
  contentTypeLabel,
  genreLabel,
  getInitials,
  numberShort,
  relativeTime,
  reviewCountLabel,
} from './format';

describe('format utilities', () => {
  it('keeps the pt-BR compact relative time', () => {
    const now = new Date('2026-10-21T12:00:00Z');

    expect(relativeTime('2026-10-21T11:59:40Z', now)).toBe('agora');
    expect(relativeTime('2026-10-21T11:45:00Z', now)).toBe('há 15 min');
    expect(relativeTime('2026-10-21T08:00:00Z', now)).toBe('há 4 h');
    expect(relativeTime('2026-10-19T12:00:00Z', now)).toBe('há 2 d');
  });

  it('falls back to an absolute date for old values', () => {
    expect(relativeTime('2026-09-01T12:00:00Z', new Date('2026-10-21T12:00:00Z'))).toContain('01');
    expect(absoluteDate('2026-09-01T12:00:00Z')).toContain('2026');
  });

  it('formats compact numbers in pt-BR', () => {
    expect(numberShort(148)).toBe('148');
    expect(numberShort(1200)).toMatch(/^1,2\s?mil$/u);
  });

  it('translates API enum values', () => {
    expect(contentTypeLabel('Album')).toBe('Álbum');
    expect(genreLabel('Horror')).toBe('Terror');
  });

  it('handles initials and review counts', () => {
    expect(getInitials('Maria Rohls')).toBe('MR');
    expect(getInitials('   ')).toBe('?');
    expect(reviewCountLabel(1)).toBe('1 review');
    expect(reviewCountLabel(3)).toBe('3 reviews');
  });
});
