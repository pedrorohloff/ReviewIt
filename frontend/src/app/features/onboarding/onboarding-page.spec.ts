import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { AuthService } from '@app/core/auth/auth.service';
import { AuthUser } from '@app/core/auth/auth-user';
import { Profile } from '@app/core/models/profile';
import { OnboardingPage } from './onboarding-page';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    email: 'teste@reviewit.demo',
    username: 'pedro.h.rohloff',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    username: 'pedro.h.rohloff',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    suspendedUntil: null,
    createdAt: '2026-10-22T12:00:00Z',
    onboarded: true,
    ...overrides,
  };
}

function setup(initialUser: AuthUser, api: Partial<ReviewApi> = {}) {
  const user = signal<AuthUser | null>(initialUser);
  const auth = {
    user: user.asReadonly(),
    isReady: () => true,
    isAuthenticated: () => user() !== null,
    isDemo: () => false,
    applyProfile: vi.fn((profile: Profile) => {
      const current = user();
      if (current && current.id === profile.id) {
        user.set({
          ...current,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          role: profile.role,
          status: profile.status,
          needsProfile: false,
          needsOnboarding: !profile.onboarded,
        });
      }
    }),
    signOut: vi.fn(),
  };

  const createProfile = vi.fn(
    api.createProfile ?? (() => of(makeProfile({ username: 'Novo nome' }))),
  );
  const updateProfile = vi.fn(
    api.updateProfile ?? (() => of(makeProfile({ username: 'Novo nome' }))),
  );

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      {
        provide: REVIEW_API,
        useValue: { createProfile, updateProfile } as unknown as ReviewApi,
      },
    ],
  });

  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

  return {
    fixture: TestBed.createComponent(OnboardingPage),
    auth,
    createProfile,
    updateProfile,
    navigate,
  };
}

function text(fixture: ComponentFixture<OnboardingPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

function submit(fixture: ComponentFixture<OnboardingPage>): void {
  const button = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
  ).find((candidate) => candidate.textContent?.includes('Continuar'));
  button?.click();
  fixture.detectChanges();
}

describe('OnboardingPage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('prefills the generated username and updates the existing profile', async () => {
    const { fixture, updateProfile, auth, navigate } = setup(makeUser({ needsOnboarding: true }));

    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#onboarding-username',
    );
    expect(input?.value).toBe('pedro.h.rohloff');

    input!.value = 'Pedro Rohls';
    input!.dispatchEvent(new Event('input'));
    submit(fixture);
    await Promise.resolve();
    fixture.detectChanges();

    expect(updateProfile).toHaveBeenCalledWith('10000000-0000-4000-8000-000000000001', {
      username: 'Pedro Rohls',
      avatarUrl: null,
    });
    expect(auth.applyProfile).toHaveBeenCalled();
    expect(auth.user()?.needsOnboarding).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('creates the profile when the session has none', async () => {
    const { fixture, createProfile, updateProfile } = setup(makeUser({ needsProfile: true }));

    fixture.detectChanges();
    submit(fixture);
    await Promise.resolve();

    expect(createProfile).toHaveBeenCalledWith({
      username: 'pedro.h.rohloff',
      avatarUrl: null,
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('recovers from a 409 by updating the profile created in the meantime', async () => {
    const { fixture, createProfile, updateProfile } = setup(makeUser({ needsProfile: true }), {
      createProfile: () => throwError(() => new ApiError(409, 'Conflito', 'Profile already exists')),
    });

    fixture.detectChanges();
    submit(fixture);
    await Promise.resolve();

    expect(createProfile).toHaveBeenCalled();
    expect(updateProfile).toHaveBeenCalledWith('10000000-0000-4000-8000-000000000001', {
      username: 'pedro.h.rohloff',
      avatarUrl: null,
    });
  });

  it('blocks submission with an invalid username', () => {
    const { fixture, updateProfile } = setup(makeUser({ needsOnboarding: true }));

    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '#onboarding-username',
    );
    input!.value = 'ab';
    input!.dispatchEvent(new Event('input'));
    submit(fixture);

    expect(updateProfile).not.toHaveBeenCalled();
    expect(text(fixture)).toContain('Use entre 3 e 50 caracteres.');
  });
});
