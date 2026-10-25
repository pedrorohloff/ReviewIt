import { Injectable, inject } from '@angular/core';
import { REVIEW_API } from '@app/core/api/review-api';
import { LoginPromptService } from '@app/core/auth/login-prompt.service';
import { Comment } from '@app/core/models/comment';
import { LikeResult } from '@app/core/models/like';
import { Post } from '@app/core/models/post';
import { ToasterService } from '@app/core/services/toaster.service';
import { PostCacheService } from '@app/features/posts/post-cache.service';

export interface LikeState {
  likedByMe: boolean;
  likeCount: number;
}

const ERROR_MESSAGE = 'Não foi possível registrar a curtida. Tente novamente.';

/** The value the UI shows immediately, before the server answers. */
export function nextLikeState(state: { likedByMe?: boolean; likeCount: number }): LikeState {
  const likedByMe = !state.likedByMe;
  return { likedByMe, likeCount: Math.max(0, state.likeCount + (likedByMe ? 1 : -1)) };
}

function confirmed(result: LikeResult): LikeState {
  return { likedByMe: result.liked, likeCount: result.likeCount };
}

/**
 * Optimistic like toggles shared by the feed cards and the detail page.
 *
 * The UI updates on the click; the server response is authoritative; a failed
 * request restores the previous state and tells the user. Posts go through
 * `PostCacheService` so every screen sees the same counts; comments are owned
 * by the caller, which receives the patches through `apply`.
 */
@Injectable({ providedIn: 'root' })
export class LikeService {
  private readonly api = inject(REVIEW_API);
  private readonly cache = inject(PostCacheService);
  private readonly toaster = inject(ToasterService);
  private readonly loginPrompt = inject(LoginPromptService);

  togglePost(post: Post): void {
    if (this.requireLogin()) {
      return;
    }

    const previous: LikeState = { likedByMe: !!post.likedByMe, likeCount: post.likeCount };

    this.cache.patch(post.id, nextLikeState(previous));

    this.api.togglePostLike(post.id).subscribe({
      next: (result) => this.cache.patch(post.id, confirmed(result)),
      error: () => {
        this.cache.patch(post.id, previous);
        this.toaster.error(ERROR_MESSAGE);
      },
    });
  }

  toggleComment(comment: Comment, apply: (patch: LikeState) => void): void {
    if (this.requireLogin()) {
      return;
    }

    const previous: LikeState = { likedByMe: !!comment.likedByMe, likeCount: comment.likeCount };

    apply(nextLikeState(previous));

    this.api.toggleCommentLike(comment.id).subscribe({
      next: (result) => apply(confirmed(result)),
      error: () => {
        apply(previous);
        this.toaster.error(ERROR_MESSAGE);
      },
    });
  }

  private requireLogin(): boolean {
    return this.loginPrompt.requireLogin({
      title: 'Entre para curtir',
      message: 'Curtir reviews e comentários exige uma conta.',
    });
  }
}
