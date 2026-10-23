import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SortOption } from '@app/core/models/post';
import { FilterPopover } from '@app/features/filters/filter-popover';
import { Icon } from '@app/shared/ui/icon/icon';
import { reviewCountLabel } from '@app/shared/utils/format';
import { FeedStore } from './feed-store';

@Component({
  selector: 'app-feed-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilterPopover, Icon, RouterLink],
  templateUrl: './feed-header.html',
  styleUrl: './feed-header.css',
})
export class FeedHeader {
  private readonly store = inject(FeedStore);
  private readonly filterButton = viewChild<ElementRef<HTMLButtonElement>>('filterButton');

  protected readonly total = this.store.totalElements;
  protected readonly sort = computed(() => this.store.filters().sort);
  protected readonly countLabel = computed(() => reviewCountLabel(this.total()));
  protected readonly filterOpen = signal(false);
  protected readonly activeCount = this.store.activeFilterCount;
  protected readonly activeFilterLabel = this.store.activeFilterLabel;

  protected setSort(value: SortOption): void {
    this.store.setFilters({ ...this.store.filters(), sort: value });
  }

  protected toggleFilters(): void {
    this.filterOpen.update((open) => !open);
  }

  protected closeFilters(): void {
    if (!this.filterOpen()) {
      return;
    }

    this.filterOpen.set(false);
    queueMicrotask(() => this.filterButton()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeFilters();
  }
}
