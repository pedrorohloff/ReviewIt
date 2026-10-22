import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ContentType, Genre } from '@app/core/models/post';
import { ReviewCover } from '@app/features/feed/review-cover';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';
import { contentTypeLabel, genreLabel } from '@app/shared/utils/format';

/** What the editor form currently holds, shown as a feed card while typing. */
export interface ReviewDraft {
  title: string;
  contentType: ContentType | null;
  genre: Genre | null;
  content: string;
}

/**
 * Read-only mirror of `ReviewCard` for the editor. It deliberately reuses the
 * card's visual language without its links and counters, so the preview never
 * pretends to be a working card.
 */
@Component({
  selector: 'app-review-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Icon, ReviewCover],
  templateUrl: './review-preview.html',
  styleUrl: './review-preview.css',
  host: {
    'aria-hidden': 'true',
  },
})
export class ReviewPreview {
  readonly draft = input.required<ReviewDraft>();
  readonly authorName = input.required<string>();
  readonly authorAvatar = input<string | null>(null);
  readonly likeCount = input(0);
  readonly commentCount = input(0);

  protected readonly title = computed(() => this.draft().title.trim() || 'Título da sua review');
  protected readonly typeLabel = computed(() => {
    const type = this.draft().contentType;
    return type ? contentTypeLabel(type) : '';
  });
  protected readonly genreLabel = computed(() => {
    const genre = this.draft().genre;
    return genre ? genreLabel(genre) : '';
  });
  protected readonly excerpt = computed(
    () => this.draft().content.trim() || 'Sua review aparece aqui enquanto você escreve.',
  );
  protected readonly placeholder = computed(() => this.draft().title.trim().length === 0);
}
