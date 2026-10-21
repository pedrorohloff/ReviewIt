import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getInitials } from '@app/shared/utils/format';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="avatar"
      [style.width.rem]="size() / 16"
      [style.height.rem]="size() / 16"
      [style.font-size.rem]="fontSize() / 16"
      [attr.aria-label]="'Foto de ' + name()"
      role="img"
    >
      @if (url()) {
        <img [src]="url()" alt="" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }

    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1.5px solid var(--color-olive);
      border-radius: 50%;
      background: var(--color-sage);
      color: var(--color-ink-strong);
      font-family: var(--font-sans);
      font-weight: 650;
      letter-spacing: 0.02em;
      line-height: 1;
      user-select: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly url = input<string | null>(null);
  readonly size = input(44);

  protected readonly initials = computed(() => getInitials(this.name()));
  protected readonly fontSize = computed(() => Math.max(11, Math.round(this.size() * 0.32)));
}
