import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { MockReviewApi } from './core/api/mock-review-api';
import { REVIEW_API } from './core/api/review-api';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: REVIEW_API, useValue: new MockReviewApi({ min: 0, max: 0 }) },
      ],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the persistent shell and the feed heading', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-top-bar')).toBeTruthy();
    expect(element.querySelector('app-feed-header h1')?.textContent).toContain('Reviews');
  });

  it('shows a brand link back to the feed', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/403');
    await fixture.whenStable();
    fixture.detectChanges();

    const brand = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      '.topbar__brand',
    );

    expect(brand?.textContent?.trim()).toBe('ReviewIt');
    expect(brand?.getAttribute('href')).toBe('/');
  });
});
