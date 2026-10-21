import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { DemoFeedService } from './demo-feed.service';
import { FeedPage } from './feed-page';

function configureRoute(params: Record<string, string>): void {
  const paramMap = convertToParamMap(params);

  TestBed.configureTestingModule({
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { queryParamMap: of(paramMap), snapshot: { queryParamMap: paramMap } },
      },
    ],
  });
}

describe('FeedPage', () => {
  it('shows the skeleton first and then the static cards', async () => {
    configureRoute({});
    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-feed-skeleton')).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-feed-skeleton')).toBeFalsy();
    expect(fixture.nativeElement.querySelectorAll('app-review-card').length).toBe(8);
    expect(fixture.nativeElement.querySelector('app-feed-footer')?.textContent).toContain(
      'fim do feed',
    );
  });

  it('hydrates the filters from the query params', async () => {
    configureRoute({ type: 'Book', genre: 'Drama', sort: 'popular' });
    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(TestBed.inject(DemoFeedService).contentType()).toBe('Book');
    expect(TestBed.inject(DemoFeedService).genre()).toBe('Drama');
    expect(TestBed.inject(DemoFeedService).sort()).toBe('popular');
    expect(fixture.nativeElement.querySelectorAll('app-review-card').length).toBe(1);
  });

  it('falls back safely for invalid query params', async () => {
    configureRoute({ type: 'Banana', genre: 'Aventura', sort: 'aleatorio' });
    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(TestBed.inject(DemoFeedService).contentType()).toBe('all');
    expect(TestBed.inject(DemoFeedService).genre()).toBe('all');
    expect(TestBed.inject(DemoFeedService).sort()).toBe('recent');
    expect(fixture.nativeElement.querySelectorAll('app-review-card').length).toBe(8);
  });

  it('renders the empty state when the query has no results', async () => {
    configureRoute({ type: 'Album', genre: 'Horror' });
    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Seu próximo favorito');
  });
});
