import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { LikeResult } from '@app/core/models/like';
import { Post } from '@app/core/models/post';
import { PostDetailPage } from './post-detail-page';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    author: { id: 'author-1', username: 'maria', avatarUrl: null },
    title: 'A casa que aprendi a habitar',
    contentType: 'Book',
    genre: 'Drama',
    content: 'Primeira linha.\n\nSegunda linha.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 148,
    commentCount: 2,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function setup(api: {
  getPost: (id: string) => Observable<Post>;
  togglePostLike?: (id: string) => Observable<LikeResult>;
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: REVIEW_API,
        useValue: {
          togglePostLike: () => of({ liked: true, likeCount: 149 }),
          ...api,
        } as unknown as ReviewApi,
      },
    ],
  });

  const fixture = TestBed.createComponent(PostDetailPage);
  return fixture;
}

async function render(fixture: ComponentFixture<PostDetailPage>, id: string): Promise<void> {
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 20));
  fixture.detectChanges();
}

function text(fixture: ComponentFixture<PostDetailPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('PostDetailPage', () => {
  it('renders the full review header and body', async () => {
    const fixture = setup({ getPost: () => of(makePost()) });

    await render(fixture, 'post-1');

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('A casa que aprendi a habitar');
    expect(text(fixture)).toContain('Livro');
    expect(text(fixture)).toContain('Drama');
    expect(text(fixture)).toContain('maria');
    expect(element.querySelector('.review__body')?.textContent).toContain('Primeira linha.');
    expect(TestBed.inject(Title).getTitle()).toBe('A casa que aprendi a habitar · ReviewIt');
  });

  it('shows a friendly state for a missing review', async () => {
    const fixture = setup({
      getPost: () => throwError(() => new ApiError(404, 'Não encontrado', 'Review ausente.')),
    });

    await render(fixture, 'missing');

    expect(text(fixture)).toContain('Review não encontrada');
    expect(fixture.nativeElement.querySelector('.review')).toBeNull();
  });

  it('offers a retry when loading fails', async () => {
    let attempt = 0;
    const fixture = setup({
      getPost: () => {
        attempt += 1;
        return attempt === 1
          ? throwError(() => new ApiError(500, 'Erro', 'Servidor fora do ar.'))
          : of(makePost());
      },
    });

    await render(fixture, 'post-1');
    expect(text(fixture)).toContain('Servidor fora do ar.');

    (fixture.nativeElement.querySelector('.state__action') as HTMLButtonElement).click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'A casa que aprendi a habitar',
    );
  });

  it('likes optimistically on click', async () => {
    const fixture = setup({ getPost: () => of(makePost()) });

    await render(fixture, 'post-1');

    const like = fixture.nativeElement.querySelector('.like') as HTMLButtonElement;
    expect(like.getAttribute('aria-pressed')).toBe('false');

    like.click();
    fixture.detectChanges();

    expect(like.classList.contains('like--on')).toBe(true);
    expect(like.getAttribute('aria-pressed')).toBe('true');
    expect(like.textContent).toContain('149');
  });
});
