import { TestBed } from '@angular/core/testing';
import { DEMO_POSTS } from '@app/mocks/fixtures';
import { ReviewCard } from './review-card';

describe('ReviewCard', () => {
  it('renders the review metadata, author and counts', () => {
    const post = DEMO_POSTS.at(0);

    if (!post) {
      throw new Error('The demo fixture is missing its first post.');
    }

    const fixture = TestBed.createComponent(ReviewCard);
    fixture.componentRef.setInput('post', post);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent).toContain('A casa que aprendi a habitar');
    expect(element.textContent).toContain('Livro');
    expect(element.textContent).toContain('Drama');
    expect(element.textContent).toContain('Maria Rohls');
    expect(element.querySelector('.stat .sr-only')?.textContent).toContain('148 curtidas');
  });
});
