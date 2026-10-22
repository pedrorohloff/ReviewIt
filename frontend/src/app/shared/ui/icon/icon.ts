import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'sliders'
  | 'search'
  | 'x'
  | 'heart'
  | 'message'
  | 'arrow-right'
  | 'arrow-left'
  | 'plus'
  | 'pencil'
  | 'flag'
  | 'trash'
  | 'share'
  | 'book'
  | 'movie'
  | 'album'
  | 'game'
  | 'chevron-down'
  | 'check'
  | 'circle-check'
  | 'triangle-alert'
  | 'info';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [style.width.rem]="size() / 16"
      [style.height.rem]="size() / 16"
      viewBox="0 0 24 24"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <use [attr.href]="'#icon-' + name()"></use>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
  readonly strokeWidth = input(1.75);
  /** Fills the shape as well as stroking it (used by the liked heart). */
  readonly filled = input(false);
}
