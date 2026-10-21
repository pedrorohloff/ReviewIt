import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-feed-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed-skeleton.html',
  styleUrl: './feed-skeleton.css',
})
export class FeedSkeleton {
  /** How many placeholder cards to draw. */
  readonly count = input<number>(3);

  /** Compact mode drops the status label, used when appending a new page. */
  readonly compact = input<boolean>(false);

  protected readonly items = computed(() =>
    Array.from({ length: Math.max(0, this.count()) }, (_, index) => index + 1),
  );
}
