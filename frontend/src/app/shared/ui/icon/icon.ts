import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'sliders'
  | 'search'
  | 'x'
  | 'heart'
  | 'message'
  | 'arrow-right'
  | 'book'
  | 'movie'
  | 'album'
  | 'game'
  | 'chevron-down'
  | 'check';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
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
}
