import { TestBed } from '@angular/core/testing';
import { Post } from '@app/core/models/post';
import { PostCacheService } from './post-cache.service';

function makePost(id: string, overrides: Partial<Post> = {}): Post {
  return {
    id,
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    title: `Review ${id}`,
    contentType: 'Book',
    genre: 'Drama',
    content: 'Um conteúdo de teste com tamanho suficiente.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 10,
    commentCount: 2,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function setup() {
  TestBed.configureTestingModule({});
  return TestBed.inject(PostCacheService);
}

describe('PostCacheService', () => {
  it('returns the same object when the post has no override', () => {
    const cache = setup();
    const post = makePost('1');

    expect(cache.merge(post)).toBe(post);
  });

  it('merges overrides without touching the other fields', () => {
    const cache = setup();
    const post = makePost('1');

    cache.patch('1', { likeCount: 11, likedByMe: true });

    const merged = cache.merge(post);
    expect(merged).not.toBe(post);
    expect(merged.likeCount).toBe(11);
    expect(merged.likedByMe).toBe(true);
    expect(merged.title).toBe(post.title);
  });

  it('accumulates partial patches for the same post', () => {
    const cache = setup();
    const post = makePost('1');

    cache.patch('1', { likeCount: 11 });
    cache.patch('1', { commentCount: 3 });

    expect(cache.merge(post)).toMatchObject({ likeCount: 11, commentCount: 3 });
  });

  it('only merges overrides into the matching post', () => {
    const cache = setup();

    cache.patch('1', { likeCount: 11 });

    expect(cache.merge(makePost('2')).likeCount).toBe(10);
  });

  it('drops overrides when a server row already carries them', () => {
    const cache = setup();
    const post = makePost('1');

    cache.patch('1', { likeCount: 11, likedByMe: true });
    cache.sync([makePost('1', { likeCount: 11, likedByMe: true })]);

    expect(cache.merge(post)).toBe(post);
  });

  it('keeps overrides the server page did not include', () => {
    const cache = setup();
    const post = makePost('1');

    cache.patch('1', { likeCount: 11 });
    cache.sync([makePost('2')]);

    expect(cache.merge(post).likeCount).toBe(11);
  });

  it('forgets every override on reset', () => {
    const cache = setup();
    const post = makePost('1');

    cache.patch('1', { likeCount: 11 });
    cache.reset();

    expect(cache.merge(post)).toBe(post);
  });
});
