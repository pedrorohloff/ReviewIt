import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';
import { EmptyState } from './empty-state';
import { FeedFooter } from './feed-footer';
import { FeedHeader } from './feed-header';
import { FeedSentinel } from './feed-sentinel';
import { FeedSkeleton } from './feed-skeleton';
import { FeedStore } from './feed-store';
import { parseFeedQuery } from './feed-query';
import { ReviewCard } from './review-card';

/**
 * Feed route component. It renders FeedStore's state and translates the URL
 * deep link into filters; the store owns loading, paging and error handling.
 * Step 3, §6 keeps this component free of data logic on purpose.
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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('feedPanel');
  protected readonly posts = this.store.posts;
  protected readonly status = this.store.status;
  protected readonly hasNext = this.store.hasNext;
  protected readonly isInitialLoading = this.store.isInitialLoading;
  protected readonly isLoadingMore = this.store.isLoadingMore;
  protected readonly hasFailed = computed(
    () => this.status() === 'error' || this.status() === 'errorMore',
  );
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar o feed agora.',
  );

  constructor() {
    const subscription = this.route.queryParamMap.subscribe((params) => {
      this.store.ensureLoaded(parseFeedQuery(params));
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected loadMore(): void {
    this.store.loadMore();
  }

  protected retry(): void {
    this.store.retry();
  }
}
