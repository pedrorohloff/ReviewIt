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
import { DemoFeedService } from '@app/features/feed/demo-feed.service';
import { FilterPopover } from '@app/features/filters/filter-popover';
import { SearchField } from '@app/features/search/search-field';
import { AuthService } from '@app/core/auth/auth.service';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';

@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, FilterPopover, Icon, SearchField],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  private readonly feed = inject(DemoFeedService);
  protected readonly auth = inject(AuthService);
  private readonly filterButton = viewChild<ElementRef<HTMLButtonElement>>('filterButton');

  protected readonly filterOpen = signal(false);
  protected readonly activeCount = computed(() => this.feed.activeFilterCount());
  protected readonly activeFilterLabel = computed(() => this.feed.activeFilterLabel());
  protected readonly username = computed(() => this.auth.user()?.username ?? 'Visitante');

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
