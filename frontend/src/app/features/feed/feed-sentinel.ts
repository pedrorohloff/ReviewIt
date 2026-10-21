import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Starts loading a little before the marker is actually on screen.
 * `rootMargin` only accepts absolute lengths or percentages, so this is in px.
 */
const PRELOAD_MARGIN = '480px';

/**
 * Invisible marker at the end of the feed list. When it enters the feed panel
 * the store is asked for the next page, which is what makes the infinite scroll
 * work. It is only rendered while `hasNext` is true, so the observer is gone as
 * soon as the feed reaches its end.
 */
@Component({
  selector: 'app-feed-sentinel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: `
    :host {
      display: block;
      height: 1px;
      margin-top: -1px;
    }
  `,
})
export class FeedSentinel {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Scroll container observed for intersections (the feed panel). */
  readonly root = input<HTMLElement | null>(null);

  readonly reached = output<void>();

  constructor() {
    afterNextRender(() => {
      // The unit-test DOM has no IntersectionObserver; the "Carregar mais"
      // button remains as the explicit way to advance there.
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.reached.emit();
          }
        },
        { root: this.root(), rootMargin: `0px 0px ${PRELOAD_MARGIN} 0px` },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
