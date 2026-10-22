import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SortOption } from '@app/core/models/post';
import { Icon } from '@app/shared/ui/icon/icon';
import { reviewCountLabel } from '@app/shared/utils/format';
import { FeedStore } from './feed-store';

@Component({
  selector: 'app-feed-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './feed-header.html',
  styleUrl: './feed-header.css',
})
export class FeedHeader {
  private readonly store = inject(FeedStore);

  protected readonly total = this.store.totalElements;
  protected readonly sort = computed(() => this.store.filters().sort);
  protected readonly countLabel = computed(() => reviewCountLabel(this.total()));

  protected setSort(value: SortOption): void {
    this.store.setFilters({ ...this.store.filters(), sort: value });
  }
}
