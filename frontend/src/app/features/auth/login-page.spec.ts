import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ApiError } from '@app/core/api/api-error';
import { AuthService } from '@app/core/auth/auth.service';
import { LoginPage } from './login-page';

interface AuthStub {
  isDemo: () => boolean;
  isReady: () => boolean;
  isAuthenticated: () => boolean;
  user: () => null;
  googleEnabled: () => boolean;
  refreshGoogleAvailability: ReturnType<typeof vi.fn>;
  signInWithPassword: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  signInWithOtp: ReturnType<typeof vi.fn>;
  signInWithGoogle: ReturnType<typeof vi.fn>;
  enterDemo: ReturnType<typeof vi.fn>;
}

function makeAuth(overrides: Partial<AuthStub> = {}): AuthStub {
  return {
    isDemo: () => false,
    isReady: () => true,
    isAuthenticated: () => false,
    user: () => null,
    googleEnabled: () => true,
    refreshGoogleAvailability: vi.fn().mockResolvedValue(true),
    signInWithPassword: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    signInWithOtp: vi.fn().mockResolvedValue(undefined),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    enterDemo: vi.fn(),
    ...overrides,
  };
}

async function render(auth: AuthStub): Promise<ComponentFixture<LoginPage>> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
      },
    ],
  });

  const fixture = TestBed.createComponent(LoginPage);
  fixture.detectChanges();
  await fixture.whenStable();

  return fixture;
}

function setInput(fixture: ComponentFixture<LoginPage>, selector: string, value: string): void {
  const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function submit(fixture: ComponentFixture<LoginPage>): void {
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit'));
}

function clickButton(fixture: ComponentFixture<LoginPage>, label: string): void {
  const button = Array.from(
    fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
  ).find((candidate) => candidate.textContent?.trim() === label);

  if (!button) {
    throw new Error(`Button "${label}" not found`);
  }

  button.click();
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows password, registration, magic-link and Google options', async () => {
    const fixture = await render(makeAuth());
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Entrar');
    expect(text).toContain('Criar conta');
    expect(text).toContain('Entrar com link por e-mail');
    expect(text).toContain('Continuar com Google');
    expect(fixture.nativeElement.querySelector('#login-email')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#login-password')).toBeTruthy();
  });

  it('signs in with email and password', async () => {
    const auth = makeAuth();
    const fixture = await render(auth);

    setInput(fixture, '#login-email', 'ana@example.com');
    setInput(fixture, '#login-password', 'senha123456');
    submit(fixture);
    await fixture.whenStable();

    expect(auth.signInWithPassword).toHaveBeenCalledWith('ana@example.com', 'senha123456');
  });

  it('switches to registration and creates an account', async () => {
    const auth = makeAuth();
    const fixture = await render(auth);

    clickButton(fixture, 'Criar conta');
    fixture.detectChanges();

    setInput(fixture, '#register-username', 'Ana');
    setInput(fixture, '#register-email', 'ana@example.com');
    setInput(fixture, '#register-password', 'senha123456');
    submit(fixture);
    await fixture.whenStable();

    expect(auth.register).toHaveBeenCalledWith('Ana', 'ana@example.com', 'senha123456');
  });

  it('sends a magic link from the passwordless view', async () => {
    const auth = makeAuth();
    const fixture = await render(auth);

    clickButton(fixture, 'Entrar com link por e-mail');
    fixture.detectChanges();

    setInput(fixture, '#magic-email', 'ana@example.com');
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.signInWithOtp).toHaveBeenCalledWith('ana@example.com');
    expect(fixture.nativeElement.textContent).toContain('Link enviado.');
  });

  it('starts the Google OAuth flow', async () => {
    const auth = makeAuth();
    const fixture = await render(auth);

    clickButton(fixture, 'Continuar com Google');
    await fixture.whenStable();

    expect(auth.signInWithGoogle).toHaveBeenCalledWith('/');
  });

  it('hides Google while the Supabase provider is disabled', async () => {
    const fixture = await render(makeAuth({ googleEnabled: () => false }));

    expect(fixture.nativeElement.textContent).not.toContain('Continuar com Google');
  });

  it('shows a friendly message for wrong credentials', async () => {
    const auth = makeAuth({
      signInWithPassword: vi
        .fn()
        .mockRejectedValue(new ApiError(401, 'Sessão expirada', 'Invalid email or password')),
    });
    const fixture = await render(auth);

    setInput(fixture, '#login-email', 'ana@example.com');
    setInput(fixture, '#login-password', 'senha123456');
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha incorretos.');
  });

  it('keeps the demo entry point working', async () => {
    const auth = makeAuth({
      isDemo: () => true,
      isReady: () => true,
      isAuthenticated: () => true,
    });
    const fixture = await render(auth);

    clickButton(fixture, 'Explorar em modo demonstração');

    expect(auth.enterDemo).toHaveBeenCalled();
  });
});
