import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-feed-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed-skeleton.html',
  styleUrl: './feed-skeleton.css',
})
export class FeedSkeleton {}
