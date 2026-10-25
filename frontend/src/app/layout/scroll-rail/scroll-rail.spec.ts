import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollRail } from './scroll-rail';

const RAIL_TOP = 100;
const RAIL_HEIGHT = 400;
const CLIENT_HEIGHT = 400;
const SCROLL_HEIGHT = 1000;

function makeRect(top: number, height: number, right: number): DOMRect {
  return {
    top,
    right,
    height,
    bottom: top + height,
    left: 0,
    width: right,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function setup(): {
  fixture: ComponentFixture<ScrollRail>;
  host: HTMLElement;
  target: HTMLElement;
  thumb: HTMLElement;
} {
  const target = document.createElement('div');
  Object.defineProperties(target, {
    clientHeight: { value: CLIENT_HEIGHT, configurable: true },
    scrollHeight: { value: SCROLL_HEIGHT, configurable: true },
    scrollTop: { value: 0, writable: true, configurable: true },
  });
  target.getBoundingClientRect = () => makeRect(RAIL_TOP, RAIL_HEIGHT, 1000);

  const fixture = TestBed.createComponent(ScrollRail);
  const host = fixture.nativeElement as HTMLElement;
  host.getBoundingClientRect = () => makeRect(RAIL_TOP, RAIL_HEIGHT, 1000);

  fixture.detectChanges();
  fixture.componentRef.setInput('target', target);
  fixture.detectChanges();
  window.dispatchEvent(new Event('resize'));
  fixture.detectChanges();

  return {
    fixture,
    host,
    target,
    thumb: host.querySelector('.rail__thumb') as HTMLElement,
  };
}

function pointer(
  props: Partial<PointerEvent> & { currentTarget?: HTMLElement },
): PointerEvent {
  return {
    button: 0,
    clientY: 0,
    pointerId: 1,
    preventDefault: vi.fn(),
    ...props,
  } as unknown as PointerEvent;
}

describe('ScrollRail', () => {
  it('aligns with the target and sizes the thumb from the scroll ratio', () => {
    const { fixture, host } = setup();

    expect(host.style.top).toBe(`${RAIL_TOP}px`);
    expect(host.style.height).toBe(`${RAIL_HEIGHT}px`);
    // (clientHeight / scrollHeight) * railHeight
    expect((host.querySelector('.rail__thumb') as HTMLElement).style.height).toBe('160px');
    expect(host.classList.contains('is-ready')).toBe(true);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('jumps when the track is clicked', () => {
    const { fixture, host, target } = setup();
    const component = fixture.componentInstance as unknown as {
      onTrackPointerDown: (event: PointerEvent) => void;
    };

    // Click at 200px from the rail top; the thumb is 160px tall, so it is
    // centered at 120px of the 240px of available thumb travel.
    component.onTrackPointerDown(pointer({ clientY: RAIL_TOP + 200 }));

    expect(target.scrollTop).toBe(300);
    expect(host).toBeTruthy();
  });

  it('drags the thumb and updates the target scroll', () => {
    const { fixture, target, thumb } = setup();
    const component = fixture.componentInstance as unknown as {
      onThumbPointerDown: (event: PointerEvent) => void;
      onThumbPointerMove: (event: PointerEvent) => void;
      onThumbPointerUp: (event: PointerEvent) => void;
    };

    component.onThumbPointerDown(pointer({ clientY: 200, currentTarget: thumb }));
    component.onThumbPointerMove(pointer({ clientY: 260 }));
    component.onThumbPointerUp(pointer({ currentTarget: thumb }));

    expect(target.scrollTop).toBe(150);
    expect(thumb.classList.contains('rail__thumb')).toBe(true);
  });

  it('forwards the wheel over the rail to the target', () => {
    const { fixture, target } = setup();
    const component = fixture.componentInstance as unknown as {
      onWheel: (event: WheelEvent) => void;
    };
    const preventDefault = vi.fn();

    component.onWheel({
      deltaY: 120,
      deltaMode: 0,
      preventDefault,
    } as unknown as WheelEvent);

    expect(target.scrollTop).toBe(120);
    expect(preventDefault).toHaveBeenCalled();
  });
});
