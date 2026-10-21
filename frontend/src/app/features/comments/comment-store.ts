import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, defer, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { AuthService } from '@app/core/auth/auth.service';
import { Comment } from '@app/core/models/comment';
import { LikeService } from '@app/features/likes/like.service';
import { PostCacheService } from '@app/features/posts/post-cache.service';

export const COMMENTS_PAGE_SIZE = 12;

/** Optimistic comments carry this prefix until the server confirms them. */
const PENDING_PREFIX = 'temp-';

export type CommentsStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'end'
  | 'loadingMore'
  | 'error'
  | 'errorMore';

/**
 * Comments of the review currently open. Provided by `PostDetailPage`, not at
 * the root, so moving to another review never shows the previous list.
 *
 * Mutations are optimistic: a comment appears (or disappears) on submit and is
 * rolled back if the request fails. The post's `commentCount` in
 * `PostCacheService` follows the list, so the feed card stays truthful too.
 */
@Injectable()
export class CommentStore {
  private readonly api = inject(REVIEW_API);
  private readonly auth = inject(AuthService);
  private readonly likes = inject(LikeService);
  private readonly cache = inject(PostCacheService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _comments = signal<Comment[]>([]);
  private readonly _total = signal(0);
  private readonly _hasNext = signal(false);
  private readonly _status = signal<CommentsStatus>('idle');
  private readonly _error = signal<ApiError | null>(null);

  private postId = '';
  private page = 0;
  private tempSeq = 0;
  private request?: Subscription;

  readonly comments = this._comments.asReadonly();
  readonly total = this._total.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  /** True once the first page resolved (successfully or not). */
  readonly loaded = computed(() => {
    const status = this._status();
    return status !== 'idle' && status !== 'loading';
  });
  readonly isLoadingMore = computed(() => this._status() === 'loadingMore');

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(postId: string): void {
    if (this.postId === postId && this._status() !== 'idle') {
      return;
    }

    this.postId = postId;
    this._comments.set([]);
    this._total.set(0);
    this._hasNext.set(false);
    this.fetch(0, true);
  }

  loadMore(): void {
    if (this._status() !== 'ready' || !this._hasNext()) {
      return;
    }
    this.fetch(this.page + 1, false);
  }

  retry(): void {
    if (this._status() === 'error') {
      this.fetch(0, true);
    } else if (this._status() === 'errorMore') {
      this.fetch(this.page + 1, false);
    }
  }

  toggleLike(comment: Comment): void {
    this.likes.toggleComment(comment, (patch) => this.patchComment(comment.id, patch));
  }

  /** Appends optimistically; the composer keeps the draft until it resolves. */
  create(content: string): Observable<Comment> {
    return defer(() => {
      const author = this.auth.user();

      if (!author) {
        return throwError(
          () => new ApiError(401, 'Entre para comentar', 'Você precisa entrar para comentar.'),
        );
      }

      const now = new Date().toISOString();
      const optimistic: Comment = {
        id: `${PENDING_PREFIX}${++this.tempSeq}`,
        postId: this.postId,
        author: { id: author.id, username: author.username, avatarUrl: author.avatarUrl },
        content,
        likeCount: 0,
        likedByMe: false,
        createdAt: now,
        updatedAt: now,
      };

      this._comments.update((comments) => [...comments, optimistic]);
      this.adjustTotal(1);

      return this.api.createComment(this.postId, { content }).pipe(
        tap((saved) => {
          this._comments.update((comments) =>
            comments.map((comment) => (comment.id === optimistic.id ? saved : comment)),
          );
        }),
        catchError((error: unknown) => {
          this._comments.update((comments) =>
            comments.filter((comment) => comment.id !== optimistic.id),
          );
          this.adjustTotal(-1);
          return throwError(() => toApiError(error));
        }),
      );
    });
  }

  /** Removes optimistically and puts the comment back at its index on failure. */
  remove(comment: Comment): Observable<void> {
    return defer(() => {
      const index = this._comments().findIndex((candidate) => candidate.id === comment.id);

      this._comments.update((comments) => comments.filter((candidate) => candidate.id !== comment.id));
      this.adjustTotal(-1);

      return this.api.deleteComment(comment.id).pipe(
        catchError((error: unknown) => {
          this._comments.update((comments) => {
            const next = [...comments];
            next.splice(Math.min(index, next.length), 0, comment);
            return next;
          });
          this.adjustTotal(1);
          return throwError(() => toApiError(error));
        }),
      );
    });
  }

  private fetch(page: number, reset: boolean): void {
    this.request?.unsubscribe();
    this._status.set(reset ? 'loading' : 'loadingMore');
    this._error.set(null);

    this.request = this.api.listComments(this.postId, page, COMMENTS_PAGE_SIZE).subscribe({
      next: (response) => {
        this._comments.set(
          reset ? response.comments : dedupeComments([...this._comments(), ...response.comments]),
        );
        this._total.set(response.totalElements);
        this._hasNext.set(response.hasNext);
        this.page = page;

        if (reset) {
          this.syncPostCount(response.totalElements);
        }

        this._status.set(
          response.totalElements === 0 ? 'empty' : response.hasNext ? 'ready' : 'end',
        );
      },
      error: (error: unknown) => {
        this._error.set(toApiError(error));
        this._status.set(reset ? 'error' : 'errorMore');
      },
    });
  }

  private patchComment(id: string, patch: { likedByMe?: boolean; likeCount?: number }): void {
    this._comments.update((comments) =>
      comments.map((comment) => (comment.id === id ? { ...comment, ...patch } : comment)),
    );
  }

  private adjustTotal(delta: number): void {
    const total = Math.max(0, this._total() + delta);
    this._total.set(total);

    if (this.loaded()) {
      this.cache.patch(this.postId, { commentCount: total });
    }
  }

  private syncPostCount(total: number): void {
    this._total.set(total);
    this.cache.patch(this.postId, { commentCount: total });
  }
}

export function isPendingComment(comment: Comment): boolean {
  return comment.id.startsWith(PENDING_PREFIX);
}

function dedupeComments(comments: readonly Comment[]): Comment[] {
  const seen = new Set<string>();
  return comments.filter((comment) => {
    if (seen.has(comment.id)) {
      return false;
    }
    seen.add(comment.id);
    return true;
  });
}
