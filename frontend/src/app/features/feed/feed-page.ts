import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';
import { EmptyState } from './empty-state';
import { FeedFooter } from './feed-footer';
import { FeedHeader } from './feed-header';
import { FeedSentinel } from './feed-sentinel';
import { FeedSkeleton } from './feed-skeleton';
import { FeedStore } from './feed-store';
import { feedFiltersKey, feedFiltersToQuery, parseFeedQuery } from './feed-query';
import { ReviewCard } from './review-card';
import { ScrollMemoryService } from './scroll-memory.service';

/**
 * Feed route component. The store owns loading, paging and errors; this
 * component only connects it to the URL and to the panel's scroll position:
 *
 * - the URL is the source of truth for the filters (shareable deep links);
 * - filter changes are written back to the URL with `replaceUrl` so typing a
 *   search does not fill the history;
 * - the scroll offset is remembered before leaving the feed and restored when
 *   the store still has the same, fresh pages.
 */
@Component({
  selector: 'app-feed-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyState,
    FeedFooter,
    FeedHeader,
    FeedSentinel,
    FeedSkeleton,
    ReviewCard,
    ScrollRail,
  ],
  templateUrl: './feed-page.html',
  styleUrl: './feed-page.css',
})
export class FeedPage {
  private readonly store = inject(FeedStore);
  private readonly scrollMemory = inject(ScrollMemoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Filters currently in the URL, to avoid navigating to the same query. */
  private urlKey = '';
  /** Filters already applied, so the first effect run is not a "change". */
  private appliedKey: string | null = null;
  /** Decided before the route subscription runs, i.e. before a stale reload. */
  private readonly restorePending = this.store.isFresh() && this.store.posts().length > 0;

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('feedPanel');
  protected readonly posts = this.store.posts;
  protected readonly status = this.store.status;
  protected readonly hasNext = this.store.hasNext;
  protected readonly isInitialLoading = this.store.isInitialLoading;
  protected readonly isLoadingMore = this.store.isLoadingMore;
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar o feed agora.',
  );

  constructor() {
    const subscription = this.route.queryParamMap.subscribe((params) => {
      const filters = parseFeedQuery(params);
      this.urlKey = feedFiltersKey(filters);
      this.store.ensureLoaded(filters);
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    effect(() => {
      const filters = this.store.filters();
      const key = feedFiltersKey(filters);

      if (this.appliedKey === null) {
        this.appliedKey = key;
        return;
      }

      if (key === this.appliedKey) {
        return;
      }

      this.appliedKey = key;

      // A new result set starts at the top and forgets the previous position.
      this.scrollMemory.clear();
      const panel = this.panel()?.nativeElement;
      if (panel) {
        panel.scrollTop = 0;
      }

      if (key !== this.urlKey) {
        this.urlKey = key;
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: feedFiltersToQuery(filters),
          replaceUrl: true,
        });
      }
    });

    afterNextRender(() => {
      // Two frames: the restored cards must be laid out before scrolling.
      requestAnimationFrame(() => requestAnimationFrame(() => this.restoreScroll()));
    });
  }

  protected rememberScroll(): void {
    const panel = this.panel()?.nativeElement;

    if (!panel) {
      return;
    }

    this.scrollMemory.save(panel.scrollTop, feedFiltersKey(this.store.filters()));
  }

  protected loadMore(): void {
    this.store.loadMore();
  }

  protected retry(): void {
    this.store.retry();
  }

  private restoreScroll(): void {
    // The store had to reload page 0 (cold or stale), so there is nothing to
    // put back on screen.
    if (!this.restorePending) {
      return;
    }

    const panel = this.panel()?.nativeElement;

    if (!panel || this.store.posts().length === 0) {
      return;
    }

    const offset = this.scrollMemory.consume(feedFiltersKey(this.store.filters()));

    if (offset === null) {
      return;
    }

    panel.scrollTop = offset;
  }
}
