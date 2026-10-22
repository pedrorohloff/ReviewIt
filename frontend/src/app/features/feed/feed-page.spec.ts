import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { MockReviewApi } from '@app/core/api/mock-review-api';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { FeedPage } from './feed-page';
import { feedFiltersKey } from './feed-query';
import { FeedStore } from './feed-store';
import { ScrollMemoryService } from './scroll-memory.service';

/** The mock adapter normally waits 250–450 ms; unit tests run it instantly. */
const noLatency = { min: 0, max: 0 };

const FEED_KEY = feedFiltersKey({ q: '', sort: 'recent' });
const FILTERED_KEY = feedFiltersKey({ q: 'duna', sort: 'recent' });

function routeProviders(params: Record<string, string>) {
  const paramMap = convertToParamMap(params);

  return {
    provide: ActivatedRoute,
    useValue: { queryParamMap: of(paramMap), snapshot: { queryParamMap: paramMap } },
  };
}

function configureRoute(
  params: Record<string, string>,
  api: ReviewApi = new MockReviewApi(noLatency),
): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: REVIEW_API, useValue: api },
      routeProviders(params),
    ],
  });
}

async function settle(fixture: ComponentFixture<FeedPage>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 60));
  fixture.detectChanges();
}

async function render(
  params: Record<string, string>,
  api?: ReviewApi,
): Promise<ComponentFixture<FeedPage>> {
  configureRoute(params, api);

  const fixture = TestBed.createComponent(FeedPage);
  fixture.detectChanges();

  await settle(fixture);

  return fixture;
}

function cards(fixture: ComponentFixture<FeedPage>): number {
  return fixture.nativeElement.querySelectorAll('app-review-card').length;
}

function text(fixture: ComponentFixture<FeedPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function panelOf(fixture: ComponentFixture<FeedPage>): HTMLElement {
  return fixture.nativeElement.querySelector('.feed-panel') as HTMLElement;
}

/** jsdom ignores `scrollTop` on unfocused elements; this makes it a plain value. */
function setScrollTop(element: HTMLElement, value: number): void {
  Object.defineProperty(element, 'scrollTop', { value, writable: true, configurable: true });
}

function clickFirstCard(fixture: ComponentFixture<FeedPage>): void {
  (fixture.nativeElement.querySelector('app-review-card') as HTMLElement).click();
}

describe('FeedPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows the skeleton while the first page is loading', () => {
    configureRoute({});

    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-feed-skeleton')).toBeTruthy();
    expect(cards(fixture)).toBe(0);
  });

  it('renders the first page and offers more reviews', async () => {
    const fixture = await render({});

    expect(fixture.nativeElement.querySelector('app-feed-skeleton')).toBeFalsy();
    expect(cards(fixture)).toBe(12);
    expect(text(fixture)).toContain('48 reviews');
    expect(fixture.nativeElement.querySelector('.feed-more')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-feed-footer')).toBeFalsy();
  });

  it('appends the next page when asked for more', async () => {
    const fixture = await render({});
    expect(cards(fixture)).toBe(12);

    (fixture.nativeElement.querySelector('.feed-more') as HTMLButtonElement).click();

    await settle(fixture);

    expect(cards(fixture)).toBe(24);
  });

  it('shows the footer once the whole feed is loaded', async () => {
    const fixture = await render({});

    for (let page = 0; page < 3; page += 1) {
      const button = fixture.nativeElement.querySelector('.feed-more') as HTMLButtonElement | null;
      if (!button) {
        break;
      }

      button.click();
      await settle(fixture);
    }

    expect(cards(fixture)).toBe(48);
    expect(fixture.nativeElement.querySelector('app-feed-footer')?.textContent).toContain(
      'fim do feed',
    );
    expect(fixture.nativeElement.querySelector('.feed-more')).toBeFalsy();
  });

  it('hydrates the filters from the query params', async () => {
    const fixture = await render({ type: 'Book', genre: 'Drama', sort: 'popular' });

    expect(TestBed.inject(FeedStore).filters()).toEqual({
      q: '',
      contentType: 'Book',
      genre: 'Drama',
      sort: 'popular',
    });
    // Book + Drama in the demo seed (three curated entries + one generated).
    expect(cards(fixture)).toBe(4);
  });

  it('falls back safely for invalid query params', async () => {
    const fixture = await render({ type: 'Banana', genre: 'Aventura', sort: 'aleatorio' });

    expect(TestBed.inject(FeedStore).filters()).toEqual({ q: '', sort: 'recent' });
    expect(cards(fixture)).toBe(12);
  });

  it('renders the empty state when the query has no results', async () => {
    const fixture = await render({ q: 'zzzz' });

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(text(fixture)).toContain('Seu próximo favorito');
  });

  it('shows the error state and recovers on retry', async () => {
    let shouldFail = true;
    const api = {
      listPosts: () => {
        if (shouldFail) {
          shouldFail = false;
          return throwError(() => new ApiError(0, 'Falha de conexão', 'Sem conexão.'));
        }
        return of({ content: [], totalElements: 0, totalPages: 0, hasNext: false });
      },
    } as unknown as ReviewApi;

    const fixture = await render({}, api);

    expect(text(fixture)).toContain('Não foi possível carregar o feed');
    expect(text(fixture)).toContain('Sem conexão.');

    (fixture.nativeElement.querySelector('.feed-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });

  it('writes the filters to the URL when they change', async () => {
    const fixture = await render({});
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    TestBed.inject(FeedStore).setFilters({ q: 'duna', sort: 'popular' });
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { q: 'duna', sort: 'popular' },
      replaceUrl: true,
    });
  });

  it('never navigates for filters the URL already has', async () => {
    const fixture = await render({ type: 'Book' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    TestBed.inject(FeedStore).setFilters({ q: '', contentType: 'Book', sort: 'recent' });
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('forgets the scroll position when the filters change', async () => {
    const fixture = await render({});
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    setScrollTop(panelOf(fixture), 640);
    clickFirstCard(fixture);

    expect(TestBed.inject(ScrollMemoryService).consume(FEED_KEY)).toBe(640);

    TestBed.inject(FeedStore).setFilters({ q: 'duna', sort: 'recent' });
    fixture.detectChanges();

    expect(TestBed.inject(ScrollMemoryService).consume(FILTERED_KEY)).toBeNull();
  });

  it('restores the scroll position when the cached feed comes back', async () => {
    const first = await render({});
    setScrollTop(panelOf(first), 640);
    clickFirstCard(first);
    first.destroy();

    const second = TestBed.createComponent(FeedPage);
    second.detectChanges();
    await settle(second);

    expect(cards(second)).toBe(12);
    expect(panelOf(second).scrollTop).toBe(640);
  });

  it('does not restore the scroll position when the store had to reload', async () => {
    const first = await render({});
    setScrollTop(panelOf(first), 640);
    clickFirstCard(first);
    TestBed.inject(FeedStore).markStale();
    first.destroy();

    const second = TestBed.createComponent(FeedPage);
    second.detectChanges();
    await settle(second);

    expect(cards(second)).toBe(12);
    expect(panelOf(second).scrollTop).toBe(0);
  });
});
