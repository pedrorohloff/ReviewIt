import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { FeedStore } from '@app/features/feed/feed-store';
import { FilterPopover } from '@app/features/filters/filter-popover';
import { SearchField } from '@app/features/search/search-field';
import { AvatarMenu } from '@app/layout/avatar-menu/avatar-menu';
import { Icon } from '@app/shared/ui/icon/icon';

@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarMenu, FilterPopover, Icon, RouterLink, SearchField],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  private readonly feed = inject(FeedStore);
  protected readonly auth = inject(AuthService);
  private readonly filterButton = viewChild<ElementRef<HTMLButtonElement>>('filterButton');

  protected readonly filterOpen = signal(false);
  protected readonly activeCount = this.feed.activeFilterCount;
  protected readonly activeFilterLabel = this.feed.activeFilterLabel;

  protected goHome(): void {
    this.filterOpen.set(false);
  }

  toggleFilters(): void {
    this.filterOpen.update((open) => !open);
  }

  closeFilters(): void {
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
