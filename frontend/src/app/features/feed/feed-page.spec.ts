import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { MockReviewApi } from '@app/core/api/mock-review-api';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { FeedPage } from './feed-page';
import { FeedStore } from './feed-store';

/** The mock adapter normally waits 250–450 ms; unit tests run it instantly. */
const noLatency = { min: 0, max: 0 };

function routeProviders(params: Record<string, string>) {
  const paramMap = convertToParamMap(params);

  return {
    provide: ActivatedRoute,
    useValue: { queryParamMap: of(paramMap), snapshot: { queryParamMap: paramMap } },
  };
}

function configureRoute(params: Record<string, string>, api: ReviewApi = new MockReviewApi(noLatency)): void {
  TestBed.configureTestingModule({
    providers: [{ provide: REVIEW_API, useValue: api }, routeProviders(params)],
  });
}

async function render(
  params: Record<string, string>,
  api?: ReviewApi,
): Promise<ComponentFixture<FeedPage>> {
  configureRoute(params, api);

  const fixture = TestBed.createComponent(FeedPage);
  fixture.detectChanges();

  await new Promise((resolve) => setTimeout(resolve, 20));
  fixture.detectChanges();

  return fixture;
}

function cards(fixture: ComponentFixture<FeedPage>): number {
  return fixture.nativeElement.querySelectorAll('app-review-card').length;
}

function text(fixture: ComponentFixture<FeedPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('FeedPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

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

    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

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
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
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
    expect(cards(fixture)).toBe(3);
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
});
