import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { DemoFeedService } from '@app/features/feed/demo-feed.service';
import { Icon } from '@app/shared/ui/icon/icon';

@Component({
  selector: 'app-search-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './search-field.html',
  styleUrl: './search-field.css',
})
export class SearchField {
  private readonly feed = inject(DemoFeedService);
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected readonly query = this.feed.query;

  protected onInput(event: Event): void {
    this.feed.setQuery((event.target as HTMLInputElement).value);
  }

  protected clear(): void {
    this.feed.setQuery('');
    this.input()?.nativeElement.focus();
  }

  protected onEscape(): void {
    if (this.query().length > 0) {
      this.feed.setQuery('');
    }

    this.input()?.nativeElement.blur();
  }
}
