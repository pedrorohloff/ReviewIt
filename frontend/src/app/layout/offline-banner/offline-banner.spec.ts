import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfflineBanner } from './offline-banner';

function setup(): ComponentFixture<OfflineBanner> {
  const fixture = TestBed.createComponent(OfflineBanner);
  fixture.detectChanges();
  return fixture;
}

describe('OfflineBanner', () => {
  it('stays hidden while the browser is online', () => {
    const fixture = setup();

    expect(fixture.nativeElement.querySelector('.offline')).toBeNull();
  });

  it('shows the warning on the offline event and hides it when the connection returns', () => {
    const fixture = setup();
    const element = fixture.nativeElement as HTMLElement;

    window.dispatchEvent(new Event('offline'));
    fixture.detectChanges();

    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Você está sem conexão',
    );

    window.dispatchEvent(new Event('online'));
    fixture.detectChanges();

    expect(element.querySelector('.offline')).toBeNull();
  });
});
