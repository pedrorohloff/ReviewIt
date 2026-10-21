import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeedStore } from './feed-store';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  private readonly store = inject(FeedStore);

  protected reset(): void {
    this.store.resetFilters();
  }
}
