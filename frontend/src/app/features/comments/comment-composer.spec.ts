import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '@app/core/auth/auth.service';
import { AuthUser } from '@app/core/auth/auth-user';
import { LoginPromptService } from '@app/core/auth/login-prompt.service';
import { CommentComposer } from './comment-composer';
import { CommentStore } from './comment-store';

const USER: AuthUser = {
  id: 'user-1',
  email: null,
  username: 'Maria',
  avatarUrl: null,
  role: 'Regular',
  status: 'Active',
};

interface PromptStub {
  requireLogin: ReturnType<typeof vi.fn>;
}

function setup(user: AuthUser | null): {
  fixture: ComponentFixture<CommentComposer>;
  prompt: PromptStub;
} {
  const prompt: PromptStub = { requireLogin: vi.fn().mockReturnValue(true) };
  const auth = {
    user: signal(user),
    isAuthenticated: signal(!!user),
    isDemo: signal(false),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: auth },
      { provide: LoginPromptService, useValue: prompt },
      { provide: CommentStore, useValue: { create: vi.fn() } },
    ],
  });

  const fixture = TestBed.createComponent(CommentComposer);
  fixture.detectChanges();

  return { fixture, prompt };
}

function actionButton(fixture: ComponentFixture<CommentComposer>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.composer__submit') as HTMLButtonElement;
}

describe('CommentComposer', () => {
  it('shows a login action for anonymous visitors', () => {
    const { fixture, prompt } = setup(null);

    expect(actionButton(fixture).textContent?.trim()).toBe('Entrar para comentar');

    actionButton(fixture).click();

    expect(prompt.requireLogin).toHaveBeenCalledWith('Entre para comentar nesta review.');
  });

  it('shows the submit action for signed-in users', () => {
    const { fixture } = setup(USER);

    expect(actionButton(fixture).textContent?.trim()).toBe('Comentar');
  });
});
