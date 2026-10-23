import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { APP_CONFIG } from '@app/core/config/app-config';
import { Profile, Role } from '@app/core/models/profile';
import { AppAuthApi, AppAuthResponse } from './app-auth-api';
import {
  clearAppToken,
  clearOAuthNext,
  readAppToken,
  writeAppToken,
  writeOAuthNext,
} from './app-token';
import { AuthUser } from './auth-user';
import { DEMO_USER } from './demo-user';

type SupabaseModule = typeof import('@supabase/supabase-js');

interface AppJwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
}

/** Keeps bootstrap from waiting forever on a slow or blocked auth chunk. */
const AUTH_RESTORE_TIMEOUT_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly appAuth = inject(AppAuthApi);

  private client: SupabaseClient | null = null;
  private clientPromise: Promise<SupabaseClient | null> | null = null;

  private readonly _session = signal<Session | null>(null);
  private readonly _appToken = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(this.config.useMock ? DEMO_USER : null);
  private readonly _isReady = signal(this.config.useMock);
  private readonly _googleEnabled = signal(false);
  private googleCheck: Promise<boolean> | null = null;

  readonly session = this._session.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly isDemo = computed(() => this.config.useMock);
  readonly googleEnabled = this._googleEnabled.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly accessToken = computed(() => this._appToken() ?? this._session()?.access_token ?? null);

  isApiRequest(url: string): boolean {
    return url.startsWith(this.config.apiBaseUrl);
  }

  /**
   * The Google button only makes sense when the Supabase project has the
   * provider enabled. Supabase exposes that in its public settings endpoint,
   * which lets us hide a button that would otherwise end on a raw error page.
   */
  async refreshGoogleAvailability(): Promise<boolean> {
    if (this.isDemo() || !this.config.hasSupabase) {
      this._googleEnabled.set(false);
      return false;
    }

    this.googleCheck ??= this.fetchGoogleAvailability();
    const enabled = await this.googleCheck;
    this._googleEnabled.set(enabled);
    return enabled;
  }

  async restoreSession(): Promise<void> {
    if (this._isReady()) {
      return;
    }

    try {
      const restoredLocalSession = await this.restoreAppSession();
      if (!restoredLocalSession) {
        await this.restoreSupabaseSession();
      }
    } catch (error) {
      // A failed auth chunk must not block the whole app from booting. The
      // user can still log in later; the page renders in a signed-out state.
      console.warn('Não foi possível restaurar a sessão anterior.', error);
    } finally {
      this._isReady.set(true);
    }
  }

  /** Restores the fixed local demo identity when the page requests it. */
  enterDemo(): void {
    if (!this.isDemo()) {
      return;
    }

    this._user.set(DEMO_USER);
    this._isReady.set(true);
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.appAuth.login({ email, password }));
    this.applyAppSession(response);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.appAuth.register({ username, email, password }));
    this.applyAppSession(response);
  }

  async signInWithOtp(email: string): Promise<void> {
    if (this.isDemo()) {
      this.enterDemo();
      return;
    }

    this.clearAppSessionState();

    const client = await this.supabase();
    if (!client) {
      throw new ApiError(0, 'Indisponível', 'O login não está configurado neste ambiente.');
    }

    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      throw new ApiError(error.status ?? 0, 'Falha ao enviar o link', error.message);
    }
  }

  async signInWithGoogle(nextUrl: string): Promise<void> {
    if (this.isDemo()) {
      this.enterDemo();
      return;
    }

    this.clearAppSessionState();

    const client = await this.supabase();
    if (!client) {
      throw new ApiError(
        0,
        'Indisponível',
        'O login com Google não está configurado neste ambiente.',
      );
    }

    writeOAuthNext(nextUrl);

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      clearOAuthNext();
      throw new ApiError(error.status ?? 0, 'Falha ao entrar com Google', error.message);
    }
  }

  async signOut(): Promise<void> {
    if (this.isDemo()) {
      this._user.set(DEMO_USER);
      return;
    }

    this.clearAppSessionState();

    try {
      const client = await this.supabase();
      await client?.auth.signOut();
    } catch (error) {
      console.warn('Não foi possível encerrar a sessão do Supabase.', error);
    }

    await this.router.navigate(['/login']);
  }

  /** Mirrors an own-profile edit into the session user. */
  applyProfile(profile: Profile): void {
    const user = this._user();

    if (!user || user.id !== profile.id) {
      return;
    }

    this._user.set({
      ...user,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      status: profile.status,
      needsProfile: false,
      needsOnboarding: profile.onboarded === false,
    });
  }

  /** Called by the problem interceptor when the backend rejects the token. */
  onUnauthorized(): void {
    if (this.isDemo()) {
      return;
    }

    this.clearAppSessionState();

    const current = this.router.url;
    const queryParams = current && current !== '/login' ? { next: current } : {};

    void this.router.navigate(['/login'], { queryParams });
  }

  private applyAppSession(response: AppAuthResponse): void {
    writeAppToken(response.accessToken);
    this._appToken.set(response.accessToken);
    this._session.set(null);
    this._user.set(userFromProfile(response.profile, response.email));
    this._isReady.set(true);
  }

  private async restoreAppSession(): Promise<boolean> {
    const token = readAppToken();
    if (!token) {
      return false;
    }

    const payload = decodeAppJwt(token);
    if (!payload?.sub || !isTokenFresh(payload)) {
      clearAppToken();
      return false;
    }

    this._appToken.set(token);

    try {
      const profile = await withTimeout(
        firstValueFrom(this.http.get<Profile>(`${this.config.apiBaseUrl}/profiles/${payload.sub}`)),
        AUTH_RESTORE_TIMEOUT_MS,
      );

      this._user.set(userFromProfile(profile, payload.email ?? null));
      return true;
    } catch (error) {
      const apiError = toApiError(error);

      if (apiError.status === 401 || apiError.status === 403 || apiError.status === 404) {
        clearAppToken();
        this._appToken.set(null);
        return false;
      }

      // Offline or transient server failure: keep the token and show a
      // minimal identity until the API is reachable again.
      this._user.set(userFromJwt(payload, payload.sub));
      return true;
    }
  }

  private async restoreSupabaseSession(): Promise<void> {
    const client = await withTimeout(this.supabase(), AUTH_RESTORE_TIMEOUT_MS);
    if (!client) {
      return;
    }

    const { data } = await withTimeout(client.auth.getSession(), AUTH_RESTORE_TIMEOUT_MS);
    await this.applySession(data.session);

    client.auth.onAuthStateChange((_event, session) => {
      void this.applySession(session);
    });
  }

  private clearAppSessionState(): void {
    clearAppToken();
    this._appToken.set(null);
    this._session.set(null);
    this._user.set(null);
  }

  private async fetchGoogleAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: this.config.supabaseAnonKey },
        signal: AbortSignal.timeout(AUTH_RESTORE_TIMEOUT_MS),
      });

      if (!response.ok) {
        return false;
      }

      return isGoogleEnabled(await response.json());
    } catch {
      return false;
    }
  }

  private async supabase(): Promise<SupabaseClient | null> {
    if (this.client) {
      return this.client;
    }

    if (this.config.useMock || !this.config.hasSupabase) {
      return null;
    }

    this.clientPromise ??= this.loadSupabaseModule()
      .then(({ createClient }) =>
        createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }),
      )
      .catch((error: unknown) => {
        // Allow a later login attempt to retry the dynamic import.
        this.clientPromise = null;
        throw error;
      });

    this.client = await this.clientPromise;
    return this.client;
  }

  protected loadSupabaseModule(): Promise<SupabaseModule> {
    return import('@supabase/supabase-js');
  }

  private async applySession(session: Session | null): Promise<void> {
    // A local email/password session owns the UI while it exists. Supabase
    // auth events can still arrive from the client created during bootstrap;
    // they must not sign the local user out or switch accounts.
    if (this._appToken()) {
      return;
    }

    this._session.set(session);

    if (session) {
      // Supabase always wins when it returns a session (magic link, Google).
      clearAppToken();
      this._appToken.set(null);
    }

    const supabaseUser = session?.user;
    if (!supabaseUser) {
      this._user.set(null);
      return;
    }

    const fallback = userFromSession(supabaseUser);
    this._user.set(fallback);

    const profile = await this.fetchProfile(fallback.id);
    if (profile) {
      this._user.set(userFromProfile(profile, fallback.email));
      return;
    }

    this._user.set({ ...fallback, needsProfile: true, needsOnboarding: false });
  }

  private async fetchProfile(id: string): Promise<Profile | null> {
    try {
      return await firstValueFrom(
        this.http.get<Profile>(`${this.config.apiBaseUrl}/profiles/${id}`),
      );
    } catch {
      return null;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`A autenticação demorou mais de ${timeoutMs} ms para responder.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isTokenFresh(payload: AppJwtPayload): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
}

function isGoogleEnabled(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const external = (value as { external?: unknown }).external;
  if (!external || typeof external !== 'object') {
    return false;
  }

  return (external as { google?: unknown }).google === true;
}

function decodeAppJwt(token: string): AppJwtPayload | null {
  const parts = token.split('.');
  const encodedPayload = parts[1];

  if (parts.length !== 3 || !encodedPayload) {
    return null;
  }

  try {
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));

    return typeof value === 'object' && value !== null ? (value as AppJwtPayload) : null;
  } catch {
    return null;
  }
}

function userFromProfile(profile: Profile, email: string | null): AuthUser {
  return {
    id: profile.id,
    email,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
    status: profile.status,
    needsProfile: false,
    needsOnboarding: profile.onboarded === false,
  };
}

function userFromJwt(payload: AppJwtPayload, id: string): AuthUser {
  const email = typeof payload.email === 'string' ? payload.email : null;

  return {
    id,
    email,
    username: email?.split('@')[0] ?? 'Usuário',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    needsProfile: false,
    needsOnboarding: false,
  };
}

function userFromSession(user: User): AuthUser {
  const metadata = user.user_metadata as Record<string, unknown>;
  const metaUsername = metadata['username'];
  const metaAvatar = metadata['avatar_url'];

  return {
    id: user.id,
    email: user.email ?? null,
    username:
      typeof metaUsername === 'string' && metaUsername.trim()
        ? metaUsername
        : (user.email?.split('@')[0] ?? 'Usuário'),
    avatarUrl: typeof metaAvatar === 'string' ? metaAvatar : null,
    role: 'Regular',
    status: 'Active',
  };
}
