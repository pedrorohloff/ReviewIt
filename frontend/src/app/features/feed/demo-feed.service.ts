import { computed, Injectable, signal } from '@angular/core';
import { ContentType, Genre, Post } from '@app/core/models/post';
import { DEMO_POSTS } from '@app/mocks/fixtures';

export type ContentTypeFilter = ContentType | 'all';
export type GenreFilter = Genre | 'all';
export type SortOption = 'recent' | 'popular';

/**
 * Step 1 only: filters the static fixture locally so the shell can be
 * validated before the API layer exists. Step 3 replaces this with FeedStore
 * (server-side search/filter/sort + infinite scroll).
 */
@Injectable({ providedIn: 'root' })
export class DemoFeedService {
  private readonly _query = signal('');
  private readonly _contentType = signal<ContentTypeFilter>('all');
  private readonly _genre = signal<GenreFilter>('all');
  private readonly _sort = signal<SortOption>('recent');

  readonly query = this._query.asReadonly();
  readonly contentType = this._contentType.asReadonly();
  readonly genre = this._genre.asReadonly();
  readonly sort = this._sort.asReadonly();

  readonly activeFilterCount = computed(
    () => (this._contentType() === 'all' ? 0 : 1) + (this._genre() === 'all' ? 0 : 1),
  );

  readonly activeFilterLabel = computed(() => {
    const count = this.activeFilterCount();
    return count === 0
      ? 'Nenhum filtro ativo'
      : count === 1
        ? '1 filtro ativo'
        : `${count} filtros ativos`;
  });

  readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this._query().trim().length > 0,
  );

  readonly posts = computed(() => {
    const query = normalize(this._query().trim());
    const contentType = this._contentType();
    const genre = this._genre();

    let list = DEMO_POSTS.filter(
      (post) =>
        (contentType === 'all' || post.contentType === contentType) &&
        (genre === 'all' || post.genre === genre),
    );

    if (query.length > 0) {
      list = list.filter((post) =>
        normalize(`${post.title} ${post.content} ${post.author.username}`).includes(query),
      );
    }

    return [...list].sort((a, b) =>
      this._sort() === 'popular'
        ? b.likeCount - a.likeCount || compareNewest(a, b)
        : compareNewest(a, b),
    );
  });

  readonly total = computed(() => this.posts().length);

  setQuery(value: string): void {
    this._query.set(value);
  }

  setContentType(value: ContentTypeFilter): void {
    this._contentType.set(value);
  }

  setGenre(value: GenreFilter): void {
    this._genre.set(value);
  }

  setSort(value: SortOption): void {
    this._sort.set(value);
  }

  clearFilters(): void {
    this._contentType.set('all');
    this._genre.set('all');
  }

  resetAll(): void {
    this.clearFilters();
    this._query.set('');
    this._sort.set('recent');
  }
}

function compareNewest(a: Post, b: Post): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}
