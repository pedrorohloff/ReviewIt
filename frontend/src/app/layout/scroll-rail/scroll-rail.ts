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

const MIN_THUMB_REM = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Custom rail that mirrors and controls the panel's vertical scroll.
 *
 * The native scrollbar is hidden on desktop; this rail sits over the target's
 * right edge and supports clicking the track, dragging the thumb, and wheeling.
 * The target stays focusable and scrollable with the keyboard.
 */
@Component({
  selector: 'app-scroll-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-rail.html',
  styleUrl: './scroll-rail.css',
  host: {
    'aria-hidden': 'true',
    '[class.is-dragging]': 'dragging()',
    '[class.is-ready]': 'ready()',
    '[style.top.px]': 'railTop()',
    '[style.height.px]': 'railHeight()',
    '[style.right.px]': 'railRight()',
    '(wheel)': 'onWheel($event)',
  },
})
export class ScrollRail {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  readonly target = input<HTMLElement | null>(null);

  protected readonly thumbTop = signal(0);
  protected readonly thumbHeight = signal(0);
  protected readonly railTop = signal(0);
  protected readonly railHeight = signal(0);
  protected readonly railRight = signal(0);
  protected readonly dragging = signal(false);
  protected readonly ready = signal(false);

  private dragPointerId: number | null = null;
  private dragStartY = 0;
  private dragStartThumbTop = 0;

  constructor() {
    effect((onCleanup) => {
      const target = this.target();

      if (!target) {
        return;
      }

      const update = () => this.measure(target);
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);

      target.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
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
        window.removeEventListener('resize', update);
        observer?.disconnect();
      });
    });
  }

  protected onTrackPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const target = this.target();
    if (!target) {
      return;
    }

    event.preventDefault();

    const railRect = this.host.nativeElement.getBoundingClientRect();
    const thumbHeight = this.thumbHeight();
    const maxThumbTop = Math.max(0, railRect.height - thumbHeight);

    if (maxThumbTop <= 0) {
      return;
    }

    const clickY = event.clientY - railRect.top;
    const top = clamp(clickY - thumbHeight / 2, 0, maxThumbTop);
    this.scrollToThumbTop(target, top, maxThumbTop);
  }

  protected onThumbPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const target = this.target();
    if (!target) {
      return;
    }

    event.preventDefault();

    const thumb = event.currentTarget as HTMLElement;
    thumb.setPointerCapture?.(event.pointerId);
    this.dragPointerId = event.pointerId;
    this.dragStartY = event.clientY;
    this.dragStartThumbTop = this.thumbTop();
    this.dragging.set(true);
  }

  protected onThumbPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    const target = this.target();
    if (!target) {
      return;
    }

    const maxThumbTop = Math.max(0, this.railHeight() - this.thumbHeight());
    if (maxThumbTop <= 0) {
      return;
    }

    const top = clamp(
      this.dragStartThumbTop + event.clientY - this.dragStartY,
      0,
      maxThumbTop,
    );
    this.scrollToThumbTop(target, top, maxThumbTop);
  }

  protected onThumbPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    this.dragPointerId = null;
    this.dragging.set(false);

    const thumb = event.currentTarget as HTMLElement;
    if (thumb.hasPointerCapture?.(event.pointerId)) {
      thumb.releasePointerCapture?.(event.pointerId);
    }
  }

  protected onWheel(event: WheelEvent): void {
    const target = this.target();
    if (!target) {
      return;
    }

    const lineHeight = parseFloat(getComputedStyle(target).lineHeight) || 16;
    const delta =
      event.deltaMode === 1
        ? event.deltaY * lineHeight
        : event.deltaMode === 2
          ? event.deltaY * target.clientHeight
          : event.deltaY;

    if (delta === 0) {
      return;
    }

    target.scrollTop += delta;
    event.preventDefault();
  }

  private scrollToThumbTop(target: HTMLElement, thumbTop: number, maxThumbTop: number): void {
    const maxScroll = target.scrollHeight - target.clientHeight;

    if (maxScroll <= 0) {
      return;
    }

    target.scrollTop = (thumbTop / maxThumbTop) * maxScroll;
  }

  private measure(target: HTMLElement): void {
    this.zone.run(() => {
      const rect = target.getBoundingClientRect();
      const railHeight = rect.height;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;

      if (railHeight <= 0 || clientHeight <= 0) {
        return;
      }

      this.railTop.set(Math.round(rect.top));
      this.railHeight.set(Math.round(railHeight));
      this.railRight.set(Math.max(0, Math.round(window.innerWidth - rect.right)));

      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const minThumbHeight = MIN_THUMB_REM * rootFontSize;

      if (scrollHeight <= clientHeight) {
        this.thumbHeight.set(railHeight);
        this.thumbTop.set(0);
        this.ready.set(true);
        return;
      }

      const thumbHeight = Math.max(minThumbHeight, (clientHeight / scrollHeight) * railHeight);
      const maxScroll = scrollHeight - clientHeight;
      const maxThumbTop = railHeight - thumbHeight;
      const top = (target.scrollTop / maxScroll) * maxThumbTop;

      this.thumbHeight.set(Math.round(thumbHeight));
      this.thumbTop.set(Math.round(top));
      this.ready.set(true);
    });
  }
}
