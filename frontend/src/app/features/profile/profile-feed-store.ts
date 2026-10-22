import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { Post } from '@app/core/models/post';
import { PostCacheService } from '@app/features/posts/post-cache.service';

export type ProfileFeedStatus =
  | 'idle'
  | 'loading'
  | 'loadingMore'
  | 'ready'
  | 'empty'
  | 'error'
  | 'errorMore'
  | 'end';

/** The author feed is shorter than the main one on purpose. */
export const PROFILE_PAGE_SIZE = 8;

/**
 * Reviews written by one author. Component-scoped: pagination, status and
 * errors are independent from the main `FeedStore`, so opening a profile never
 * touches the feed the user left behind.
 */
@Injectable()
export class ProfileFeedStore {
  private readonly api = inject(REVIEW_API);
  private readonly cache = inject(PostCacheService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _posts = signal<Post[]>([]);
  private readonly _status = signal<ProfileFeedStatus>('idle');
  private readonly _hasNext = signal(false);
  private readonly _total = signal(0);
  private readonly _error = signal<ApiError | null>(null);

  private authorId: string | null = null;
  private page = 0;
  private request?: Subscription;

  readonly posts = computed(() => this._posts().map((post) => this.cache.merge(post)));
  readonly status = this._status.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly totalElements = this._total.asReadonly();
  readonly error = this._error.asReadonly();

  readonly isInitialLoading = computed(
    () => this._status() === 'loading' && this._posts().length === 0,
  );
  readonly isLoadingMore = computed(() => this._status() === 'loadingMore');

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(authorId: string): void {
    if (this.authorId === authorId && this._status() !== 'idle') {
      return;
    }

    this.authorId = authorId;
    this._posts.set([]);
    this._total.set(0);
    this._hasNext.set(false);
    this.page = 0;
    this.fetch(0, true);
  }

  reload(): void {
    if (!this.authorId) {
      return;
    }

    const authorId = this.authorId;
    this.authorId = null;
    this.load(authorId);
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

  private fetch(page: number, reset: boolean): void {
    const authorId = this.authorId;

    if (!authorId) {
      return;
    }

    this.request?.unsubscribe();
    this._status.set(reset ? 'loading' : 'loadingMore');
    this._error.set(null);

    this.request = this.api
      .listPosts({ page, pageSize: PROFILE_PAGE_SIZE, authorId, sort: 'recent' })
      .subscribe({
        next: (result) => {
          const posts = reset ? result.content : [...this._posts(), ...result.content];
          this._posts.set(posts);
          this._total.set(result.totalElements);
          this._hasNext.set(result.hasNext);
          this.page = page;

          if (posts.length === 0) {
            this._status.set('empty');
            return;
          }

          this._status.set(result.hasNext ? 'ready' : 'end');
        },
        error: (error: unknown) => {
          this._error.set(toApiError(error));
          this._status.set(reset ? 'error' : 'errorMore');
        },
      });
  }
}
