import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ContentType } from '@app/core/models/post';
import { Icon, IconName } from '@app/shared/ui/icon/icon';
import { contentTypeLabel } from '@app/shared/utils/format';

const COVER_ICONS: Record<ContentType, IconName> = {
  Book: 'book',
  Movie: 'movie',
  Album: 'album',
  Game: 'game',
};

@Component({
  selector: 'app-review-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './review-cover.html',
  styleUrl: './review-cover.css',
  host: {
    'aria-hidden': 'true',
  },
})
export class ReviewCover {
  readonly type = input.required<ContentType>();
  readonly title = input.required<string>();

  protected readonly icon = computed(() => COVER_ICONS[this.type()]);
  protected readonly typeLabel = computed(() => contentTypeLabel(this.type()));
  protected readonly initial = computed(
    () => this.title().trim().charAt(0).toLocaleUpperCase('pt-BR') || '?',
  );
}
