import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Comment } from '@app/core/models/comment';
import { RelativeTimePipe } from '@app/shared/pipes/relative-time-pipe';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';

@Component({
  selector: 'app-comment-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Icon, RelativeTimePipe],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  readonly comment = input.required<Comment>();
  readonly canDelete = input(false);
  /** True while the comment is still an optimistic placeholder. */
  readonly pending = input(false);

  readonly like = output<void>();
  readonly remove = output<void>();

  protected readonly likeLabel = computed(() => {
    const comment = this.comment();
    const action = comment.likedByMe ? 'Remover curtida' : 'Curtir';
    return `${action} · ${comment.likeCount} ${comment.likeCount === 1 ? 'curtida' : 'curtidas'}`;
  });
}
