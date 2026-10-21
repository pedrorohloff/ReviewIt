import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

const MIN_THUMB_HEIGHT = 48;

/**
 * Thin custom rail for the feed panel. It mirrors the panel's height,
 * scroll height and scroll offset without hijacking the native scroll.
 */
@Component({
  selector: 'app-scroll-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-rail.html',
  styleUrl: './scroll-rail.css',
  host: {
    'aria-hidden': 'true',
  },
})
export class ScrollRail {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  readonly target = input<HTMLElement | null>(null);

  protected readonly thumbTop = signal(0);
  protected readonly thumbHeight = signal(MIN_THUMB_HEIGHT);

  constructor() {
    effect((onCleanup) => {
      const target = this.target();

      if (!target) {
        return;
      }

      const update = () => this.measure(target);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);

      target.addEventListener('scroll', update, { passive: true });
      observer?.observe(target);

      // The panel's own box height stays constant while the feed grows or
      // shrinks (skeleton -> cards, filters), so observe the column too.
      const content = target.firstElementChild;
      if (content) {
        observer?.observe(content);
      }

      update();

      onCleanup(() => {
        target.removeEventListener('scroll', update);
        observer?.disconnect();
      });
    });
  }

  private measure(target: HTMLElement): void {
    this.zone.run(() => {
      const railHeight = this.host.nativeElement.clientHeight;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      if (railHeight <= 0 || clientHeight <= 0) {
        return;
      }

      if (scrollHeight <= clientHeight) {
        this.thumbHeight.set(railHeight);
        this.thumbTop.set(0);
        return;
      }

      const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (clientHeight / scrollHeight) * railHeight);
      const maxScroll = scrollHeight - clientHeight;
      const maxThumbTop = railHeight - thumbHeight;
      const top = (target.scrollTop / maxScroll) * maxThumbTop;

      this.thumbHeight.set(Math.round(thumbHeight));
      this.thumbTop.set(Math.round(top));
    });
  }
}
