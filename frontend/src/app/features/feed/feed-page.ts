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
import { DemoFeedService } from './demo-feed.service';
import { EmptyState } from './empty-state';
import { FeedFooter } from './feed-footer';
import { FeedHeader } from './feed-header';
import { FeedSkeleton } from './feed-skeleton';
import { ReviewCard } from './review-card';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';

/**
 * Step 1 mounts the feed with a short simulated load so the skeleton can be
 * reviewed. Step 3 removes the timer and drives `loading` from FeedStore.
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('feedPanel');
  protected readonly posts = this.feed.posts;
  protected readonly loading = signal(true);

  constructor() {
    afterNextRender(() => {
      const timer = setTimeout(() => this.loading.set(false), SIMULATED_LOAD_MS);
      this.destroyRef.onDestroy(() => clearTimeout(timer));
    });
  }
}
