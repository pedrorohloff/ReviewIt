import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { Comment, CommentPage } from '@app/core/models/comment';
import { LikeResult } from '@app/core/models/like';
import { Post } from '@app/core/models/post';
import { PostCacheService } from '@app/features/posts/post-cache.service';
import { CommentStore } from './comment-store';

function makeComment(id: string, overrides: Partial<Comment> = {}): Comment {
  return {
    id,
    postId: 'post-1',
    author: { id: 'user-1', username: 'maria', avatarUrl: null },
    content: `Comentário ${id}`,
    likeCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function page(comments: Comment[], overrides: Partial<CommentPage> = {}): CommentPage {
  return {
    comments,
    totalElements: comments.length,
    totalPages: 1,
    hasNext: false,
    ...overrides,
  };
}

function makePost(): Post {
  return {
    id: 'post-1',
    author: { id: 'user-1', username: 'maria', avatarUrl: null },
    title: 'Review',
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 0,
    commentCount: 2,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function setup(api: Partial<ReviewApi> = {}) {
  TestBed.configureTestingModule({
    providers: [
      CommentStore,
      {
        provide: REVIEW_API,
        useValue: {
          listComments: () => of(page([])),
          createComment: () => throwError(() => new ApiError(500, 'Erro', 'Falha.')),
          deleteComment: () => of(undefined),
          toggleCommentLike: () => of({ liked: true, likeCount: 1 }),
          ...api,
        } as unknown as ReviewApi,
      },
    ],
  });

  return {
    store: TestBed.inject(CommentStore),
    cache: TestBed.inject(PostCacheService),
  };
}

describe('CommentStore', () => {
  it('loads the first page and reports whether more exist', () => {
    const { store } = setup({
      listComments: () => of(page([makeComment('1'), makeComment('2')], { hasNext: true })),
    });

    store.load('post-1');

    expect(store.comments().map((comment) => comment.id)).toEqual(['1', '2']);
    expect(store.total()).toBe(2);
    expect(store.hasNext()).toBe(true);
    expect(store.status()).toBe('ready');
  });

  it('shows an empty state instead of an empty list', () => {
    const { store } = setup();

    store.load('post-1');

    expect(store.status()).toBe('empty');
    expect(store.comments()).toEqual([]);
  });

  it('appends the next page only when there is one', () => {
    let call = 0;
    const { store } = setup({
      listComments: () => {
        call += 1;
        return call === 1
          ? of(page([makeComment('1')], { hasNext: true, totalElements: 2 }))
          : of(page([makeComment('2')], { totalElements: 2 }));
      },
    });

    store.load('post-1');
    store.loadMore();

    expect(store.comments().map((comment) => comment.id)).toEqual(['1', '2']);
    expect(store.hasNext()).toBe(false);
    expect(store.status()).toBe('end');
  });

  it('keeps the page count on the post cache', () => {
    const { store, cache } = setup({
      listComments: () => of(page([makeComment('1'), makeComment('2')])),
    });

    store.load('post-1');

    expect(cache.merge(makePost()).commentCount).toBe(2);
  });

  it('appends the new comment optimistically and confirms it', () => {
    const answer = new Subject<Comment>();
    const { store, cache } = setup({
      listComments: () => of(page([makeComment('1')])),
      createComment: () => answer.asObservable(),
    });

    store.load('post-1');
    store.create('Meu comentário').subscribe();

    expect(store.comments()).toHaveLength(2);
    expect(store.comments().at(1)?.content).toBe('Meu comentário');
    expect(store.total()).toBe(2);
    expect(cache.merge(makePost()).commentCount).toBe(2);

    answer.next(makeComment('saved', { content: 'Meu comentário' }));

    expect(store.comments().at(1)?.id).toBe('saved');
    expect(store.total()).toBe(2);
  });

  it('rolls the new comment back when the request fails', () => {
    const { store, cache } = setup({
      listComments: () => of(page([makeComment('1')])),
    });

    store.load('post-1');

    const failures: ApiError[] = [];
    store
      .create('Não vai passar')
      .subscribe({ error: (error: ApiError) => failures.push(error) });

    expect(store.comments()).toHaveLength(1);
    expect(store.total()).toBe(1);
    expect(cache.merge(makePost()).commentCount).toBe(1);
    expect(failures.at(0)?.message).toBe('Falha.');
  });

  it('removes optimistically and restores the comment at its index', () => {
    const answer = new Subject<void>();
    const { store } = setup({
      listComments: () => of(page([makeComment('1'), makeComment('2'), makeComment('3')])),
      deleteComment: () => answer.asObservable(),
    });

    store.load('post-1');

    const failures: ApiError[] = [];
    store
      .remove(makeComment('2'))
      .subscribe({ error: (error: ApiError) => failures.push(error) });

    expect(store.comments().map((comment) => comment.id)).toEqual(['1', '3']);

    answer.error(new ApiError(500, 'Erro', 'Falha.'));

    expect(store.comments().map((comment) => comment.id)).toEqual(['1', '2', '3']);
    expect(store.total()).toBe(3);
    expect(failures.at(0)?.message).toBe('Falha.');
  });

  it('toggles a comment like in place', () => {
    const { store } = setup({
      listComments: () => of(page([makeComment('1', { likeCount: 3 })])),
      toggleCommentLike: () => of({ liked: true, likeCount: 4 } as LikeResult),
    });

    store.load('post-1');
    const [first] = store.comments();

    if (!first) {
      throw new Error('The comment list should not be empty.');
    }

    store.toggleLike(first);

    expect(store.comments().at(0)).toMatchObject({ likeCount: 4, likedByMe: true });
  });
});
