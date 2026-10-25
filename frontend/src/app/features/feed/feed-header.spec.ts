import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { LoginPromptService } from '@app/core/auth/login-prompt.service';
import { FeedStore } from './feed-store';
import { FeedHeader } from './feed-header';

interface PromptStub {
  requireLogin: ReturnType<typeof vi.fn>;
}

function setup(opened: boolean): {
  fixture: ComponentFixture<FeedHeader>;
  prompt: PromptStub;
  router: { navigate: ReturnType<typeof vi.fn> };
} {
  const prompt: PromptStub = { requireLogin: vi.fn().mockReturnValue(opened) };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const store = {
    totalElements: signal(3),
    filters: signal({ sort: 'recent' as const }),
    activeFilterCount: signal(0),
    activeFilterLabel: signal(''),
    setFilters: vi.fn(),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: FeedStore, useValue: store },
      { provide: Router, useValue: router },
      { provide: LoginPromptService, useValue: prompt },
    ],
  });

  const fixture = TestBed.createComponent(FeedHeader);
  fixture.detectChanges();

  return { fixture, prompt, router };
}

function newReviewButton(fixture: ComponentFixture<FeedHeader>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.feed-head__new') as HTMLButtonElement;
}

describe('FeedHeader', () => {
  it('opens the login prompt instead of navigating for anonymous visitors', () => {
    const { fixture, prompt, router } = setup(true);

    newReviewButton(fixture).click();

    expect(prompt.requireLogin).toHaveBeenCalledWith({
      title: 'Entre para criar review',
      message: 'Publique sua própria review com uma conta.',
      next: '/new',
    });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the editor when the visitor can proceed', () => {
    const { fixture, router } = setup(false);

    newReviewButton(fixture).click();

    expect(router.navigate).toHaveBeenCalledWith(['/new']);
  });
});
