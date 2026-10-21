import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Post } from '@app/core/models/post';
import { LikeService } from '@app/features/likes/like.service';
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
  private readonly likes = inject(LikeService);

  readonly post = input.required<Post>();

  protected readonly typeLabel = computed(() => contentTypeLabel(this.post().contentType));
  protected readonly genreLabel = computed(() => genreLabel(this.post().genre));
  protected readonly likeLabel = computed(() => {
    const post = this.post();
    const action = post.likedByMe ? 'Remover curtida' : 'Curtir';
    return `${action} · ${post.likeCount} ${post.likeCount === 1 ? 'curtida' : 'curtidas'}`;
  });

  protected toggleLike(event: Event): void {
    // The whole card is a link in the next step; liking must not navigate.
    event.stopPropagation();
    this.likes.togglePost(this.post());
  }
}
