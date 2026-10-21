import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ContentType, Genre } from '@app/core/models/post';
import {
  ContentTypeFilter,
  DemoFeedService,
  GenreFilter,
} from '@app/features/feed/demo-feed.service';
import { CONTENT_TYPE_LABELS, GENRE_LABELS } from '@app/shared/utils/format';
import { Icon } from '@app/shared/ui/icon/icon';

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

const TYPE_OPTIONS: readonly FilterOption<ContentTypeFilter>[] = [
  { value: 'all', label: 'Tudo' },
  ...(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((value) => ({
    value,
    label: CONTENT_TYPE_LABELS[value],
  })),
];

const GENRE_OPTIONS: readonly FilterOption<GenreFilter>[] = [
  { value: 'all', label: 'Tudo' },
  ...(Object.keys(GENRE_LABELS) as Genre[]).map((value) => ({
    value,
    label: GENRE_LABELS[value],
  })),
];

@Component({
  selector: 'app-filter-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './filter-popover.html',
  styleUrl: './filter-popover.css',
})
export class FilterPopover {
  private readonly feed = inject(DemoFeedService);

  readonly closed = output<void>();

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly genreOptions = GENRE_OPTIONS;
  protected readonly contentType = this.feed.contentType;
  protected readonly genre = this.feed.genre;
  protected readonly activeFilterCount = this.feed.activeFilterCount;
  protected readonly activeFilterLabel = this.feed.activeFilterLabel;
  protected setContentType(value: ContentTypeFilter): void {
    this.feed.setContentType(value);
  }

  protected setGenre(value: GenreFilter): void {
    this.feed.setGenre(value);
  }

  protected clear(): void {
    this.feed.clearFilters();
  }

  protected close(): void {
    this.closed.emit();
  }
}
