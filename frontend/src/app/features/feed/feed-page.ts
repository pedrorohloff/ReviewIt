import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoFeedService } from './demo-feed.service';
import { EmptyState } from './empty-state';
import { FeedFooter } from './feed-footer';
import { FeedHeader } from './feed-header';
import { FeedSkeleton } from './feed-skeleton';
import { parseFeedQuery } from './feed-query';
import { ReviewCard } from './review-card';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';

/**
 * Step 1 mounts the feed with a short simulated load so the skeleton can be
 * reviewed. Step 3 removes the timer and drives `loading` from FeedStore.
 *
 * URL hydration is intentionally one-way for now: Step 2 reads `q`, `type`,
 * `genre` and `sort` from the deep link; Step 3 replaces this service with
 * FeedStore and keeps the URL in sync while the user edits filters.
 */
const SIMULATED_LOAD_MS = 280;

@Component({
  selector: 'app-feed-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, FeedFooter, FeedHeader, FeedSkeleton, ReviewCard, ScrollRail],
  templateUrl: './feed-page.html',
  styleUrl: './feed-page.css',
})
export class FeedPage {
  private readonly feed = inject(DemoFeedService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('feedPanel');
  protected readonly posts = this.feed.posts;
  protected readonly loading = signal(true);

  constructor() {
    const subscription = this.route.queryParamMap.subscribe((params) => {
      const filters = parseFeedQuery(params);
      this.feed.setQuery(filters.q);
      this.feed.setContentType(filters.contentType ?? 'all');
      this.feed.setGenre(filters.genre ?? 'all');
      this.feed.setSort(filters.sort);
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());

    afterNextRender(() => {
      const timer = setTimeout(() => this.loading.set(false), SIMULATED_LOAD_MS);
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });
  }
}
