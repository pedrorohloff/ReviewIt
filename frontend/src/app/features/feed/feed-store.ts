import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { FeedFilters, Post } from '@app/core/models/post';
import { environment } from '../../../environments/environment';
import { DEFAULT_FEED_FILTERS, feedFiltersEqual } from './feed-query';

export type FeedStatus =
  | 'idle'
  | 'loading'
  | 'loadingMore'
  | 'error'
  | 'errorMore'
  | 'empty'
  | 'end';

/** A cached feed older than this is reloaded on the next visit. */
const STALE_AFTER_MS = 60_000;

/**
 * Root-provided state for the reviews feed. It owns the loaded pages, the
 * status machine and the active filters, and is the single consumer of
 * `ReviewApi.listPosts`. Components only read its signals or call its methods.
 *
 * The store is kept across navigation on purpose so returning from a detail
 * page reuses the loaded pages instead of refetching them (Step 3, §6.6).
 */
@Injectable({ providedIn: 'root' })
export class FeedStore {
  private readonly api = inject(REVIEW_API);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _posts = signal<Post[]>([]);
  private readonly _status = signal<FeedStatus>('idle');
  private readonly _hasNext = signal(true);
  private readonly _total = signal(0);
  private readonly _filters = signal<FeedFilters>({ ...DEFAULT_FEED_FILTERS });
  private readonly _error = signal<ApiError | null>(null);

  private page = 0;
  private request?: Subscription;
  private loadedAt = 0;

  readonly posts = this._posts.asReadonly();
  readonly status = this._status.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly totalElements = this._total.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly error = this._error.asReadonly();

  /** True only for the first page of a reset, when no card is on screen yet. */
  readonly isInitialLoading = computed(
    () => this._status() === 'loading' && this._posts().length === 0,
  );
  readonly isLoadingMore = computed(() => this._status() === 'loadingMore');

  readonly activeFilterCount = computed(() => {
    const filters = this._filters();
    return (filters.contentType ? 1 : 0) + (filters.genre ? 1 : 0);
  });

  readonly activeFilterLabel = computed(() => {
    const count = this.activeFilterCount();
    if (count === 0) {
      return 'Nenhum filtro ativo';
    }
    return count === 1 ? '1 filtro ativo' : `${count} filtros ativos`;
  });

  readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this._filters().q.trim().length > 0,
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  /**
   * Called once by `FeedPage` after reading the URL. Loads page 0 on a cold or
   * stale store; otherwise it just applies the filters (no refetch when equal).
   */
  ensureLoaded(next: FeedFilters): void {
    if (this.loadedAt === 0 || Date.now() - this.loadedAt > STALE_AFTER_MS) {
      this._filters.set({ ...next });
      this.reset();
      this.fetch(0, true);
      return;
    }
    this.setFilters(next);
  }

  setFilters(next: FeedFilters): void {
    if (feedFiltersEqual(next, this._filters())) {
      return;
    }
    this._filters.set({ ...next });
    this.reset();
    this.fetch(0, true);
  }

  resetFilters(): void {
    this.setFilters({ ...DEFAULT_FEED_FILTERS });
  }

  loadMore(): void {
    // Only advance from a settled first page. Loading, error and end states
    // require the explicit "Carregar mais"/retry actions instead.
    if (this._status() !== 'idle' || !this._hasNext() || this._posts().length === 0) {
      return;
    }
    this.fetch(this.page + 1, false);
  }

  retry(): void {
    const status = this._status();
    if (status === 'error') {
      this.fetch(0, true);
    } else if (status === 'errorMore') {
      this.fetch(this.page + 1, false);
    }
  }

  markStale(): void {
    this.loadedAt = 0;
  }

  private reset(): void {
    this.request?.unsubscribe();
    this._posts.set([]);
    this._total.set(0);
    this._hasNext.set(true);
    this._error.set(null);
    this.page = 0;
    this.loadedAt = 0;
  }

  private fetch(page: number, reset: boolean): void {
    this.request?.unsubscribe();
    this._status.set(reset ? 'loading' : 'loadingMore');
    this._error.set(null);

    this.request = this.api
      .listPosts({
        page,
        pageSize: environment.pageSize,
        ...this._filters(),
      })
      .subscribe({
        next: (response) => {
          this._posts.set(
            reset ? response.content : dedupeById([...this._posts(), ...response.content]),
          );
          this._total.set(response.totalElements);
          this._hasNext.set(response.hasNext);
          this.page = page;
          this.loadedAt = Date.now();
          this._status.set(
            response.totalElements === 0 ? 'empty' : response.hasNext ? 'idle' : 'end',
          );
        },
        error: (error: unknown) => {
          this._error.set(toApiError(error));
          this._status.set(reset ? 'error' : 'errorMore');
        },
      });
  }
}

/** Drops repeats caused by offset pagination while new posts are inserted. */
export function dedupeById(posts: readonly Post[]): Post[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
}
