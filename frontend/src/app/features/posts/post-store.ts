import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { NotificationSettingsInput, Post, PostInput } from '@app/core/models/post';
import { Report } from '@app/core/models/report';
import { PostCacheService } from './post-cache.service';

export type PostStatus = 'idle' | 'loading' | 'ready' | 'notFound' | 'error';

/**
 * State for the review being read. The post is merged with
 * `PostCacheService`, so a like made here is already visible on the feed when
 * the user goes back.
 */
@Injectable({ providedIn: 'root' })
export class PostStore {
  private readonly api = inject(REVIEW_API);
  private readonly cache = inject(PostCacheService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _post = signal<Post | null>(null);
  private readonly _status = signal<PostStatus>('idle');
  private readonly _error = signal<ApiError | null>(null);

  private request?: Subscription;
  private currentId: string | null = null;

  readonly post = computed(() => {
    const post = this._post();
    return post ? this.cache.merge(post) : null;
  });
  readonly status = this._status.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  /** Loads the post, keeping the current one on screen while it refreshes. */
  load(id: string): void {
    if (this.currentId !== id) {
      this.currentId = id;
      this._post.set(null);
    }

    this.request?.unsubscribe();
    this._status.set('loading');
    this._error.set(null);

    this.request = this.api.getPost(id).subscribe({
      next: (post) => {
        this._post.set(post);
        this._status.set('ready');
      },
      error: (error: unknown) => {
        const apiError = toApiError(error);
        this._error.set(apiError);
        this._status.set(apiError.status === 404 ? 'notFound' : 'error');
      },
    });
  }

  retry(): void {
    if (this.currentId) {
      this.load(this.currentId);
    }
  }

  /** Adopts a server row (create/update) without another GET. */
  apply(post: Post): void {
    this.currentId = post.id;
    this._post.set(post);
    this._error.set(null);
    this._status.set('ready');
  }

  /** Drops the current post after it was deleted. */
  forget(id: string): void {
    if (this.currentId !== id) {
      return;
    }

    this.request?.unsubscribe();
    this.currentId = null;
    this._post.set(null);
    this._error.set(null);
    this._status.set('idle');
  }

  create(input: PostInput): Observable<Post> {
    return this.api.createPost(input);
  }

  update(id: string, input: PostInput): Observable<Post> {
    return this.api.updatePost(id, input);
  }

  saveNotificationSettings(id: string, input: NotificationSettingsInput): Observable<Post> {
    return this.api.updateNotificationSettings(id, input);
  }

  delete(id: string): Observable<void> {
    return this.api.deletePost(id);
  }

  report(reason: string): Observable<Report> {
    const post = this._post();

    if (!post) {
      throw new ApiError(0, 'Indisponível', 'A review ainda não foi carregada.');
    }

    return this.api.createReport({ postId: post.id, reason });
  }
}
