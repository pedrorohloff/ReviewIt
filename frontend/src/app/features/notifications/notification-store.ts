import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { Notification } from '@app/core/models/notification';
import { ToasterService } from '@app/core/services/toaster.service';

export type NotificationStatus =
  | 'idle'
  | 'loading'
  | 'loadingMore'
  | 'ready'
  | 'empty'
  | 'error'
  | 'errorMore'
  | 'end';

export const NOTIFICATION_PAGE_SIZE = 10;

/**
 * In-app notification center. Component-scoped with the notifications page:
 * the list, its pagination and the optimistic read state belong to that view.
 */
@Injectable()
export class NotificationStore {
  private readonly api = inject(REVIEW_API);
  private readonly toaster = inject(ToasterService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _items = signal<Notification[]>([]);
  private readonly _status = signal<NotificationStatus>('idle');
  private readonly _hasNext = signal(false);
  private readonly _total = signal(0);
  private readonly _error = signal<ApiError | null>(null);
  private readonly _titles = signal<ReadonlyMap<string, string | null>>(new Map());

  private page = 0;
  private request?: Subscription;

  readonly items = this._items.asReadonly();
  readonly status = this._status.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly totalElements = this._total.asReadonly();
  readonly error = this._error.asReadonly();

  /** Post titles resolved per id; `null` means the post is gone. */
  readonly titles = this._titles.asReadonly();

  readonly unreadCount = computed(() => this._items().filter((item) => !item.readAt).length);
  readonly isInitialLoading = computed(
    () => this._status() === 'loading' && this._items().length === 0,
  );
  readonly isLoadingMore = computed(() => this._status() === 'loadingMore');

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(): void {
    this._items.set([]);
    this._total.set(0);
    this._hasNext.set(false);
    this.page = 0;
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

  /**
   * Optimistic: the row loses its unread dot right away, and gets it back if
   * the PATCH fails.
   */
  markRead(notification: Notification): void {
    if (notification.readAt) {
      return;
    }

    this.patchReadAt(notification.id, new Date().toISOString());

    this.api
      .markNotificationRead(notification.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.patchReadAt(notification.id, null);
          this.toaster.error('Não foi possível marcar a notificação como lida.');
        },
      });
  }

  private fetch(page: number, reset: boolean): void {
    this.request?.unsubscribe();
    this._status.set(reset ? 'loading' : 'loadingMore');
    this._error.set(null);

    this.request = this.api.listNotifications(page, NOTIFICATION_PAGE_SIZE).subscribe({
      next: (result) => {
        const items = reset ? result.notifications : [...this._items(), ...result.notifications];
        this._items.set(items);
        this._total.set(result.totalElements);
        this._hasNext.set(result.hasNext);
        this.page = page;

        if (items.length === 0) {
          this._status.set('empty');
        } else {
          this._status.set(result.hasNext ? 'ready' : 'end');
        }

        this.resolveTitles(result.notifications);
      },
      error: (error: unknown) => {
        this._error.set(toApiError(error));
        this._status.set(reset ? 'error' : 'errorMore');
      },
    });
  }

  /**
   * The API returns only the post id, so titles are fetched per notification
   * on demand. Bounded by the page size and cached for the session.
   */
  private resolveTitles(notifications: Notification[]): void {
    const missing = [...new Set(notifications.map((item) => item.postId))].filter(
      (postId) => !this._titles().has(postId),
    );

    for (const postId of missing) {
      this.api
        .getPost(postId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (post) => this.setTitle(postId, post.title),
          error: () => this.setTitle(postId, null),
        });
    }
  }

  private setTitle(postId: string, title: string | null): void {
    this._titles.update((titles) => new Map(titles).set(postId, title));
  }

  private patchReadAt(id: string, readAt: string | null): void {
    this._items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, readAt } : item)),
    );
  }
}
