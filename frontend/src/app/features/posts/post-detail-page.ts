import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { toApiError } from '@app/core/api/api-error';
import { Comment } from '@app/core/models/comment';
import { ToasterService } from '@app/core/services/toaster.service';
import { CommentComposer } from '@app/features/comments/comment-composer';
import { CommentList } from '@app/features/comments/comment-list';
import { CommentStore } from '@app/features/comments/comment-store';
import { LikeService } from '@app/features/likes/like.service';
import { RelativeTimePipe } from '@app/shared/pipes/relative-time-pipe';
import { DateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '@app/shared/ui/icon/icon';
import { contentTypeLabel, genreLabel } from '@app/shared/utils/format';
import { PostStore } from './post-store';

/**
 * The full review: header, body and comments.
 *
 * The panel owns the scroll of this route, like the feed panel does, so the
 * page never scrolls the document. Leaving restores the feed via
 * `Location.back()` when we arrived from a feed card (`state.fromFeed`),
 * falling back to the feed route on deep links.
 */
@Component({
  selector: 'app-post-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, CommentComposer, CommentList, ConfirmDialog, DateFormatPipe, Icon, RelativeTimePipe, RouterLink],
  providers: [CommentStore],
  templateUrl: './post-detail-page.html',
  styleUrl: './post-detail-page.css',
})
export class PostDetailPage {
  private readonly store = inject(PostStore);
  private readonly comments = inject(CommentStore);
  private readonly likes = inject(LikeService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly title = inject(Title);
  private readonly toaster = inject(ToasterService);
  private readonly document = inject(DOCUMENT);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('detailPanel');
  protected readonly commentsSection = viewChild<ElementRef<HTMLElement>>('commentsSection');

  protected readonly post = this.store.post;
  protected readonly status = this.store.status;
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar esta review agora.',
  );
  protected readonly typeLabel = computed(() => {
    const post = this.post();
    return post ? contentTypeLabel(post.contentType) : '';
  });
  protected readonly genreLabel = computed(() => {
    const post = this.post();
    return post ? genreLabel(post.genre) : '';
  });
  protected readonly likeLabel = computed(() => {
    const post = this.post();
    if (!post) {
      return 'Curtir';
    }
    const action = post.likedByMe ? 'Remover curtida' : 'Curtir';
    return `${action} · ${post.likeCount} ${post.likeCount === 1 ? 'curtida' : 'curtidas'}`;
  });
  protected readonly commentCount = computed(() =>
    this.comments.loaded() ? this.comments.total() : (this.post()?.commentCount ?? 0),
  );

  protected readonly pendingDelete = signal<Comment | null>(null);
  protected readonly deleting = signal(false);

  protected readonly reportOpen = signal(false);
  protected readonly reportReason = signal('');
  protected readonly reporting = signal(false);
  protected readonly reasonLength = computed(() => this.reportReason().trim().length);
  protected readonly reportDisabled = computed(
    () => this.reporting() || this.reasonLength() < 5,
  );

  private fragmentScrolled = false;

  constructor() {
    effect(() => {
      const id = this.id();
      // The stores write signals; running them untracked keeps this effect on
      // the route parameter alone.
      untracked(() => {
        this.store.load(id);
        this.comments.load(id);
      });
    });

    effect(() => {
      const post = this.post();
      if (post) {
        this.title.setTitle(`${post.title} · ReviewIt`);
      }
    });

    // `/posts/:id#comments` must scroll the panel, not the document. It runs
    // after the render that paints the comment list: scrolling earlier would
    // hit the panel's current scroll limit and stop halfway. The guard keeps
    // likes, edits and extra pages from scrolling the reader again.
    afterRenderEffect(() => {
      const loaded = this.comments.loaded();
      const section = this.commentsSection();

      if (!loaded || !section || this.fragmentScrolled) {
        return;
      }

      if (this.document.location.hash !== '#comments') {
        return;
      }

      this.fragmentScrolled = true;
      section.nativeElement.scrollIntoView({ block: 'start' });
    });
  }

  protected toggleLike(): void {
    const post = this.post();
    if (post) {
      this.likes.togglePost(post);
    }
  }

  protected async copyLink(): Promise<void> {
    const post = this.post();
    if (!post) {
      return;
    }

    try {
      await navigator.clipboard.writeText(`${this.document.location.origin}/posts/${post.id}`);
      this.toaster.success('Link copiado.');
    } catch {
      this.toaster.error('Não foi possível copiar o link.');
    }
  }

  protected retry(): void {
    this.store.retry();
  }

  protected askRemove(comment: Comment): void {
    this.pendingDelete.set(comment);
  }

  protected cancelRemove(): void {
    if (!this.deleting()) {
      this.pendingDelete.set(null);
    }
  }

  protected confirmRemove(): void {
    const comment = this.pendingDelete();

    if (!comment) {
      return;
    }

    this.deleting.set(true);

    this.comments.remove(comment).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toaster.success('Comentário removido.');
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.toaster.error(toApiError(error).message);
      },
    });
  }

  protected openReport(): void {
    this.reportReason.set('');
    this.reportOpen.set(true);
  }

  protected closeReport(): void {
    if (!this.reporting()) {
      this.reportOpen.set(false);
    }
  }

  protected onReasonInput(event: Event): void {
    this.reportReason.set((event.target as HTMLTextAreaElement).value);
  }

  protected submitReport(): void {
    if (this.reportDisabled()) {
      return;
    }

    this.reporting.set(true);

    this.store.report(this.reportReason().trim()).subscribe({
      next: () => {
        this.reporting.set(false);
        this.reportOpen.set(false);
        this.toaster.success('Denúncia enviada. Obrigado por avisar.');
      },
      error: (error: unknown) => {
        this.reporting.set(false);
        const apiError = toApiError(error);
        this.toaster.error(
          apiError.status === 409 ? 'Você já denunciou esta review.' : apiError.message,
        );
      },
    });
  }

  protected goBack(): void {
    const state = this.location.getState() as { fromFeed?: boolean } | null;

    if (state?.fromFeed) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }
}
