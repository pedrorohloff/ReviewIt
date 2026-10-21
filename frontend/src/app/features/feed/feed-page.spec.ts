import { TestBed } from '@angular/core/testing';
import { DemoFeedService } from './demo-feed.service';
import { FeedPage } from './feed-page';

describe('FeedPage', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('shows the skeleton first and then the static cards', async () => {
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

  it('renders the empty state when filters have no results', async () => {
    TestBed.inject(DemoFeedService).setContentType('Album');
    TestBed.inject(DemoFeedService).setGenre('Horror');

    const fixture = TestBed.createComponent(FeedPage);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 320));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Seu próximo favorito');
  });
});
