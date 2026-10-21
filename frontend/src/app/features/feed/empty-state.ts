import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DemoFeedService } from './demo-feed.service';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  private readonly feed = inject(DemoFeedService);

  protected reset(): void {
    this.feed.resetAll();
  }
}
