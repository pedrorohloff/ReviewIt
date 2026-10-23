import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ContentType, FeedFilters, Genre } from '@app/core/models/post';
import { FeedStore } from '@app/features/feed/feed-store';
import { CONTENT_TYPE_LABELS, GENRE_LABELS } from '@app/shared/utils/format';
import { Icon } from '@app/shared/ui/icon/icon';

type ContentTypeFilter = ContentType | 'all';
type GenreFilter = Genre | 'all';

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
  private readonly store = inject(FeedStore);

  readonly align = input<'start' | 'end'>('start');
  readonly closed = output<void>();

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly genreOptions = GENRE_OPTIONS;
  protected readonly contentType = computed<ContentTypeFilter>(
    () => this.store.filters().contentType ?? 'all',
  );
  protected readonly genre = computed<GenreFilter>(() => this.store.filters().genre ?? 'all');
  protected readonly activeFilterCount = this.store.activeFilterCount;
  protected readonly activeFilterLabel = this.store.activeFilterLabel;

  protected setContentType(value: ContentTypeFilter): void {
    this.patch({ contentType: value === 'all' ? undefined : value });
  }

  protected setGenre(value: GenreFilter): void {
    this.patch({ genre: value === 'all' ? undefined : value });
  }

  protected clear(): void {
    const { q, sort } = this.store.filters();
    this.store.setFilters({ q, sort });
  }

  protected close(): void {
    this.closed.emit();
  }

  /** Rebuilds the filters dropping the keys that were reset to "all". */
  private patch(partial: { contentType?: ContentType; genre?: Genre }): void {
    const current = this.store.filters();
    const next: FeedFilters = { q: current.q, sort: current.sort };
    const contentType = 'contentType' in partial ? partial.contentType : current.contentType;
    const genre = 'genre' in partial ? partial.genre : current.genre;

    if (contentType) {
      next.contentType = contentType;
    }
    if (genre) {
      next.genre = genre;
    }

    this.store.setFilters(next);
  }
}
