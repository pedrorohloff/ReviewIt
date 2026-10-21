import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';
import { Comment } from '@app/core/models/comment';
import { CommentItem } from './comment-item';
import { CommentStore, isPendingComment } from './comment-store';

/** The list owns the store wiring; the page only handles deleting (dialog). */
@Component({
  selector: 'app-comment-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommentItem],
  templateUrl: './comment-list.html',
  styleUrl: './comment-list.css',
})
export class CommentList {
  private readonly store = inject(CommentStore);
  private readonly auth = inject(AuthService);

  readonly remove = output<Comment>();

  protected readonly comments = this.store.comments;
  protected readonly status = this.store.status;
  protected readonly hasNext = this.store.hasNext;
  protected readonly isLoadingMore = this.store.isLoadingMore;
  protected readonly currentUserId = computed(() => this.auth.user()?.id ?? null);
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar os comentários.',
  );
  protected readonly skeletonRows = [1, 2, 3];

  protected loadMore(): void {
    this.store.loadMore();
  }

  protected retry(): void {
    this.store.retry();
  }

  protected toggleLike(comment: Comment): void {
    this.store.toggleLike(comment);
  }

  protected isPending(comment: Comment): boolean {
    return isPendingComment(comment);
  }
}
