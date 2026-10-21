import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Static end state for Step 1. Step 3 replaces it with the infinite-scroll
 * sentinel and the real "end of feed" state.
 */
@Component({
  selector: 'app-feed-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed-footer.html',
  styleUrl: './feed-footer.css',
})
export class FeedFooter {}
