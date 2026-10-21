import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';
import { RelativeTimePipe } from '@app/shared/pipes/relative-time-pipe';
import { DateFormatPipe } from '@app/shared/pipes/date-format-pipe';
import { ToasterService } from '@app/core/services/toaster.service';
import { LikeService } from '@app/features/likes/like.service';
import { contentTypeLabel, genreLabel } from '@app/shared/utils/format';
import { PostStore } from './post-store';

/**
 * The full review: header, body and (in the next commit) comments.
 *
 * The panel owns the scroll of this route, like the feed panel does, so the
 * page never scrolls the document. Leaving restores the feed via
 * `Location.back()` when we arrived from a feed card (`state.fromFeed`),
 * falling back to the feed route on deep links.
 */
@Component({
  selector: 'app-post-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, DateFormatPipe, Icon, RelativeTimePipe, RouterLink],
  templateUrl: './post-detail-page.html',
  styleUrl: './post-detail-page.css',
})
export class PostDetailPage {
  private readonly store = inject(PostStore);
  private readonly likes = inject(LikeService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly title = inject(Title);
  private readonly toaster = inject(ToasterService);
  private readonly document = inject(DOCUMENT);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('detailPanel');

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

  constructor() {
    effect(() => {
      const id = this.id();
      this.store.load(id);
    });

    effect(() => {
      const post = this.post();
      if (post) {
        this.title.setTitle(`${post.title} · ReviewIt`);
      }
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

  protected goBack(): void {
    const state = this.location.getState() as { fromFeed?: boolean } | null;

    if (state?.fromFeed) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }
}
