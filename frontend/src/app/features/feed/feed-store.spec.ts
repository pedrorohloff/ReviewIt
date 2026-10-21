import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { ListPostsParams, Post, PostPage } from '@app/core/models/post';
import { environment } from '../../../environments/environment';
import { DEFAULT_FEED_FILTERS } from './feed-query';
import { FeedStore } from './feed-store';

type ListPostsImpl = (params: ListPostsParams) => Observable<PostPage>;

function makePost(id: string): Post {
  return {
    id,
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    title: `Review ${id}`,
    contentType: 'Book',
    genre: 'Drama',
    content: 'Um conteúdo de teste com tamanho suficiente.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 0,
    commentCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function postPage(content: Post[], overrides: Partial<PostPage> = {}): PostPage {
  return { content, totalElements: content.length, totalPages: 1, hasNext: false, ...overrides };
}

function setup(impl: ListPostsImpl) {
  const listPosts = vi.fn(impl);

  TestBed.configureTestingModule({
    providers: [{ provide: REVIEW_API, useValue: { listPosts } as unknown as ReviewApi }],
  });

  return { store: TestBed.inject(FeedStore), listPosts };
}

const FIRST_PAGE_PARAMS = { page: 0, pageSize: environment.pageSize, q: '', sort: 'recent' };

describe('FeedStore', () => {
  it('loads the first page with the configured page size', () => {
    const { store, listPosts } = setup(() =>
      of(postPage([makePost('1'), makePost('2')], { hasNext: true, totalPages: 4 })),
    );

    store.ensureLoaded(DEFAULT_FEED_FILTERS);

    expect(listPosts).toHaveBeenCalledWith(FIRST_PAGE_PARAMS);
    expect(store.posts().map((post) => post.id)).toEqual(['1', '2']);
    expect(store.totalElements()).toBe(2);
    expect(store.hasNext()).toBe(true);
    expect(store.status()).toBe('idle');
  });

  it('appends the next page and drops repeated ids', () => {
    const { store, listPosts } = setup((params) =>
      params.page === 0
        ? of(postPage([makePost('1'), makePost('2')], { hasNext: true }))
        : of(postPage([makePost('2'), makePost('3')], { hasNext: false })),
    );

    store.ensureLoaded(DEFAULT_FEED_FILTERS);
    store.loadMore();

    expect(listPosts).toHaveBeenLastCalledWith({ ...FIRST_PAGE_PARAMS, page: 1 });
    expect(store.posts().map((post) => post.id)).toEqual(['1', '2', '3']);
    expect(store.status()).toBe('end');
  });

  it('ignores loadMore while the first page is still loading', () => {
    const pending = new Subject<PostPage>();
    const { store, listPosts } = setup(() => pending.asObservable());

    store.ensureLoaded(DEFAULT_FEED_FILTERS);
    expect(store.isInitialLoading()).toBe(true);

    store.loadMore();

    expect(listPosts).toHaveBeenCalledTimes(1);
    pending.next(postPage([makePost('1')], { hasNext: true }));
    expect(store.isInitialLoading()).toBe(false);
  });

  it('stops requesting once the feed reached the end', () => {
    const { store, listPosts } = setup(() => of(postPage([makePost('1')], { hasNext: false })));

    store.ensureLoaded(DEFAULT_FEED_FILTERS);
    expect(store.status()).toBe('end');

    store.loadMore();

    expect(listPosts).toHaveBeenCalledTimes(1);
  });

  it('enters the empty state when the query has no results', () => {
    const { store } = setup(() => of(postPage([], { hasNext: false, totalElements: 0 })));

    store.ensureLoaded({ q: 'zzz', sort: 'recent' });

    expect(store.status()).toBe('empty');
    expect(store.posts()).toEqual([]);
  });

  it('resets the feed when filters change and ignores equal filters', () => {
    let calls = 0;
    const { store, listPosts } = setup(() => {
      calls += 1;
      return of(postPage([makePost(String(calls))], { hasNext: false }));
    });

    store.ensureLoaded(DEFAULT_FEED_FILTERS);
    expect(listPosts).toHaveBeenCalledTimes(1);

    store.setFilters(DEFAULT_FEED_FILTERS);
    expect(listPosts).toHaveBeenCalledTimes(1);

    store.setFilters({ q: 'duna', sort: 'popular' });
    expect(listPosts).toHaveBeenCalledTimes(2);
    expect(listPosts).toHaveBeenLastCalledWith({
      page: 0,
      pageSize: environment.pageSize,
      q: 'duna',
      sort: 'popular',
    });
    expect(store.posts().map((post) => post.id)).toEqual(['2']);
  });

  it('keeps the loaded posts when a next page fails and retries it', () => {
    let shouldFail = true;
    const { store, listPosts } = setup((params) => {
      if (params.page === 0) {
        return of(postPage([makePost('1')], { hasNext: true }));
      }
      if (shouldFail) {
        shouldFail = false;
        return throwError(() => new ApiError(500, 'Erro no servidor', 'boom'));
      }
      return of(postPage([makePost('2')], { hasNext: false }));
    });

    store.ensureLoaded(DEFAULT_FEED_FILTERS);
    store.loadMore();

    expect(store.status()).toBe('errorMore');
    expect(store.posts().map((post) => post.id)).toEqual(['1']);
    expect(store.error()?.message).toBe('boom');

    store.loadMore();
    expect(listPosts).toHaveBeenCalledTimes(2);

    store.retry();

    expect(store.status()).toBe('end');
    expect(store.posts().map((post) => post.id)).toEqual(['1', '2']);
  });

  it('shows a full error state on the first page and recovers on retry', () => {
    let shouldFail = true;
    const { store } = setup(() => {
      if (shouldFail) {
        shouldFail = false;
        return throwError(() => new ApiError(0, 'Falha de conexão', 'offline'));
      }
      return of(postPage([makePost('1')], { hasNext: false }));
    });

    store.ensureLoaded(DEFAULT_FEED_FILTERS);

    expect(store.status()).toBe('error');
    expect(store.posts()).toEqual([]);
    expect(store.isInitialLoading()).toBe(false);

    store.retry();

    expect(store.status()).toBe('end');
    expect(store.posts().map((post) => post.id)).toEqual(['1']);
  });

  it('exposes the active filter count, label and reset', () => {
    const { store } = setup(() => of(postPage([], { hasNext: false, totalElements: 0 })));

    store.setFilters({ q: 'casa', contentType: 'Book', genre: 'Drama', sort: 'recent' });

    expect(store.activeFilterCount()).toBe(2);
    expect(store.activeFilterLabel()).toBe('2 filtros ativos');
    expect(store.hasActiveFilters()).toBe(true);

    store.resetFilters();

    expect(store.filters()).toEqual(DEFAULT_FEED_FILTERS);
    expect(store.activeFilterCount()).toBe(0);
    expect(store.hasActiveFilters()).toBe(false);
  });
});
