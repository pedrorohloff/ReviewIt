import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { Post } from '@app/core/models/post';
import { DEMO_POSTS } from '@app/mocks/fixtures';
import { ReviewCard } from './review-card';

function fixturePost(): Post {
  const post = DEMO_POSTS.at(0);

  if (!post) {
    throw new Error('The demo fixture is missing its first post.');
  }

  return post;
}

function setup(post: Post = fixturePost()) {
  const togglePostLike = vi.fn(() => of({ liked: true, likeCount: post.likeCount + 1 }));

  TestBed.configureTestingModule({
    providers: [{ provide: REVIEW_API, useValue: { togglePostLike } as unknown as ReviewApi }],
  });

  const fixture = TestBed.createComponent(ReviewCard);
  fixture.componentRef.setInput('post', post);
  fixture.detectChanges();

  return { fixture, togglePostLike, element: fixture.nativeElement as HTMLElement };
}

describe('ReviewCard', () => {
  it('renders the review metadata, author and counts', () => {
    const { element } = setup();

    expect(element.querySelector('h2')?.textContent).toContain('A casa que aprendi a habitar');
    expect(element.textContent).toContain('Livro');
    expect(element.textContent).toContain('Drama');
    expect(element.textContent).toContain('Maria Rohls');

    const like = element.querySelector<HTMLButtonElement>('.stat--like');
    expect(like?.getAttribute('aria-label')).toContain('148 curtidas');
    expect(like?.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles the like without leaving the card', () => {
    const { element, togglePostLike } = setup();
    const like = element.querySelector<HTMLButtonElement>('.stat--like');

    like?.click();

    expect(togglePostLike).toHaveBeenCalledWith(fixturePost().id);
  });
});
