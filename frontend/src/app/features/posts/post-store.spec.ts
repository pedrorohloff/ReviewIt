import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { Post } from '@app/core/models/post';
import { PostCacheService } from './post-cache.service';
import { PostStore } from './post-store';

function makePost(id = 'post-1', overrides: Partial<Post> = {}): Post {
  return {
    id,
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    title: 'Uma review',
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 3,
    commentCount: 2,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function setup(impl: (id: string) => Observable<Post>) {
  const getPost = vi.fn(impl);

  TestBed.configureTestingModule({
    providers: [{ provide: REVIEW_API, useValue: { getPost } as unknown as ReviewApi }],
  });

  return { store: TestBed.inject(PostStore), getPost };
}

describe('PostStore', () => {
  it('loads a post and exposes it as ready', () => {
    const { store, getPost } = setup((id) => of(makePost(id)));

    store.load('post-1');

    expect(getPost).toHaveBeenCalledWith('post-1');
    expect(store.status()).toBe('ready');
    expect(store.post()?.title).toBe('Uma review');
  });

  it('maps a missing post to notFound', () => {
    const { store } = setup(() =>
      throwError(() => new ApiError(404, 'Não encontrado', 'Review ausente.')),
    );

    store.load('missing');

    expect(store.status()).toBe('notFound');
    expect(store.post()).toBeNull();
    expect(store.error()?.status).toBe(404);
  });

  it('keeps server failures apart from missing posts', () => {
    const { store } = setup(() =>
      throwError(() => new ApiError(500, 'Erro', 'Falha inesperada.')),
    );

    store.load('post-1');

    expect(store.status()).toBe('error');
    expect(store.error()?.message).toBe('Falha inesperada.');
  });

  it('retries the current post', () => {
    let attempt = 0;
    const { store, getPost } = setup(() => {
      attempt += 1;
      return attempt === 1
        ? throwError(() => new ApiError(500, 'Erro', 'Falha.'))
        : of(makePost());
    });

    store.load('post-1');
    store.retry();

    expect(getPost).toHaveBeenCalledTimes(2);
    expect(store.status()).toBe('ready');
  });

  it('merges like overrides made on another screen', () => {
    const { store } = setup((id) => of(makePost(id)));
    const cache = TestBed.inject(PostCacheService);

    store.load('post-1');
    cache.patch('post-1', { likeCount: 99, likedByMe: true });

    expect(store.post()).toMatchObject({ likeCount: 99, likedByMe: true });
  });

  it('drops the previous post when another one starts loading', () => {
    const { store } = setup((id) => of(makePost(id)));

    store.load('post-1');
    store.load('post-2');

    expect(store.post()?.id).toBe('post-2');
  });
});
