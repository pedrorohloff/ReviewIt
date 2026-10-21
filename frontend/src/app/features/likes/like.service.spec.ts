import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { Comment } from '@app/core/models/comment';
import { LikeResult } from '@app/core/models/like';
import { Post } from '@app/core/models/post';
import { ToasterService } from '@app/core/services/toaster.service';
import { PostCacheService } from '@app/features/posts/post-cache.service';
import { LikeService } from './like.service';

function makePost(): Post {
  return {
    id: 'post-1',
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    title: 'Review',
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 10,
    commentCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeComment(): Comment {
  return {
    id: 'comment-1',
    postId: 'post-1',
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    content: 'Comentário.',
    likeCount: 3,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function setup() {
  const postAnswer = new Subject<LikeResult>();
  const commentAnswer = new Subject<LikeResult>();
  const api = {
    togglePostLike: vi.fn(() => postAnswer.asObservable()),
    toggleCommentLike: vi.fn(() => commentAnswer.asObservable()),
  };

  TestBed.configureTestingModule({
    providers: [{ provide: REVIEW_API, useValue: api as unknown as ReviewApi }],
  });

  return {
    service: TestBed.inject(LikeService),
    cache: TestBed.inject(PostCacheService),
    toaster: TestBed.inject(ToasterService),
    postAnswer,
    commentAnswer,
    api,
  };
}

describe('LikeService', () => {
  it('updates the post optimistically and confirms with the server', () => {
    const { service, cache, postAnswer } = setup();
    const post = makePost();

    service.togglePost(post);

    expect(cache.merge(post)).toMatchObject({ likedByMe: true, likeCount: 11 });

    postAnswer.next({ liked: true, likeCount: 42 });
    postAnswer.complete();

    expect(cache.merge(post)).toMatchObject({ likedByMe: true, likeCount: 42 });
  });

  it('also unlikes optimistically', () => {
    const { service, cache } = setup();
    const post = { ...makePost(), likedByMe: true, likeCount: 11 };

    service.togglePost(post);

    expect(cache.merge(post)).toMatchObject({ likedByMe: false, likeCount: 10 });
  });

  it('rolls the post back and warns when the request fails', () => {
    const { service, cache, toaster, postAnswer } = setup();
    const post = makePost();

    service.togglePost(post);
    postAnswer.error(new Error('offline'));

    expect(cache.merge(post)).toMatchObject({ likedByMe: false, likeCount: 10 });
    expect(toaster.toasts().at(-1)).toMatchObject({ kind: 'error' });
  });

  it('rolls the comment back through the caller callback', () => {
    const { service, commentAnswer, toaster } = setup();
    const comment = makeComment();
    const states: { likedByMe: boolean; likeCount: number }[] = [];

    service.toggleComment(comment, (patch) => states.push(patch));

    expect(states.at(-1)).toEqual({ likedByMe: true, likeCount: 4 });

    commentAnswer.error(new Error('offline'));

    expect(states.at(-1)).toEqual({ likedByMe: false, likeCount: 3 });
    expect(toaster.toasts().at(-1)).toMatchObject({ kind: 'error' });
  });
});
