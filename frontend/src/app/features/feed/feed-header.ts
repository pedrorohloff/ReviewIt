import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DemoFeedService, SortOption } from '@app/features/feed/demo-feed.service';
import { reviewCountLabel } from '@app/shared/utils/format';

@Component({
  selector: 'app-feed-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed-header.html',
  styleUrl: './feed-header.css',
})
export class FeedHeader {
  private readonly feed = inject(DemoFeedService);

  protected readonly total = this.feed.total;
  protected readonly sort = this.feed.sort;
  protected readonly countLabel = computed(() => reviewCountLabel(this.total()));

  protected setSort(value: SortOption): void {
    this.feed.setSort(value);
  }
}
