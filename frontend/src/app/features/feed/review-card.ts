import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Post } from '@app/core/models/post';
import { RelativeTimePipe } from '@app/shared/pipes/relative-time-pipe';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';
import { genreLabel, contentTypeLabel } from '@app/shared/utils/format';
import { ReviewCover } from './review-cover';

@Component({
  selector: 'app-review-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Icon, RelativeTimePipe, ReviewCover],
  templateUrl: './review-card.html',
  styleUrl: './review-card.css',
})
export class ReviewCard {
  readonly post = input.required<Post>();

  protected readonly typeLabel = computed(() => contentTypeLabel(this.post().contentType));
  protected readonly genreLabel = computed(() => genreLabel(this.post().genre));
}
