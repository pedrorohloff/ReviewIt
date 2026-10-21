import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FeedStore } from '@app/features/feed/feed-store';
import { Icon } from '@app/shared/ui/icon/icon';

/** Matches the "digitando" pause used across the app before hitting the API. */
const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-search-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './search-field.html',
  styleUrl: './search-field.css',
})
export class SearchField {
  private readonly store = inject(FeedStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  private debounce?: ReturnType<typeof setTimeout>;

  constructor() {
    // Keeps the input in sync when filters change elsewhere (deep link, the
    // empty-state reset or the "limpar" action of the popover).
    effect(() => this.query.set(this.store.filters().q));

    this.destroyRef.onDestroy(() => clearTimeout(this.debounce));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);

    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.store.setFilters({ ...this.store.filters(), q: value });
    }, SEARCH_DEBOUNCE_MS);
  }

  protected clear(): void {
    clearTimeout(this.debounce);
    this.apply('');
    this.input()?.nativeElement.focus();
  }

  protected onEscape(): void {
    if (this.query().length > 0) {
      clearTimeout(this.debounce);
      this.apply('');
    }

    this.input()?.nativeElement.blur();
  }

  private apply(value: string): void {
    this.query.set(value);
    this.store.setFilters({ ...this.store.filters(), q: value });
  }
}
