import { TestBed } from '@angular/core/testing';
import { DemoFeedService } from './demo-feed.service';

describe('DemoFeedService', () => {
  let service: DemoFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoFeedService);
  });

  it('starts with the whole fixture feed in reverse chronological order', () => {
    expect(service.total()).toBe(8);
    expect(service.posts().at(0)?.title).toBe('A casa que aprendi a habitar');
  });

  it('combines content type and genre filters', () => {
    service.setContentType('Book');
    service.setGenre('Comedy');

    expect(service.posts().map((post) => post.title)).toEqual([
      'Manual de sobrevivência para adultos cansados',
    ]);
    expect(service.activeFilterCount()).toBe(2);
  });

  it('searches title, body and author without requiring accents', () => {
    service.setQuery('joao');

    expect(service.total()).toBe(2);
    expect(service.posts().every((post) => post.author.username === 'João Lima')).toBe(true);
  });

  it('sorts popular posts by like count', () => {
    service.setSort('popular');

    expect(service.posts().at(0)?.likeCount).toBe(148);
    expect(service.posts().at(-1)?.likeCount).toBe(0);
  });

  it('resetAll clears search, filters and sort', () => {
    service.setQuery('cinema');
    service.setContentType('Movie');
    service.setSort('popular');

    service.resetAll();

    expect(service.query()).toBe('');
    expect(service.contentType()).toBe('all');
    expect(service.sort()).toBe('recent');
    expect(service.total()).toBe(8);
  });
});
