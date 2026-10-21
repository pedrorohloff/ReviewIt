import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { APP_CONFIG } from '@app/core/config/app-config';
import { Profile, Role } from '@app/core/models/profile';
import { AuthUser } from './auth-user';
import { DEMO_USER } from './demo-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private client: SupabaseClient | null = null;
  private clientPromise: Promise<SupabaseClient | null> | null = null;

  private readonly _session = signal<Session | null>(null);
  private readonly _user = signal<AuthUser | null>(this.config.useMock ? DEMO_USER : null);
  private readonly _isReady = signal(this.config.useMock);

  readonly session = this._session.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly isDemo = computed(() => this.config.useMock);
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly accessToken = computed(() => this._session()?.access_token ?? null);

  isApiRequest(url: string): boolean {
    return url.startsWith(this.config.apiBaseUrl);
  }

  async restoreSession(): Promise<void> {
    if (this._isReady()) {
      return;
    }

    const client = await this.supabase();
    if (!client) {
      this._isReady.set(true);
      return;
    }

    const { data } = await client.auth.getSession();
    await this.applySession(data.session);

    client.auth.onAuthStateChange((_event, session) => {
      void this.applySession(session);
    });

    this._isReady.set(true);
  }

  /** Restores the fixed local demo identity when the page requests it. */
  enterDemo(): void {
    if (!this.isDemo()) {
      return;
    }

    this._user.set(DEMO_USER);
    this._isReady.set(true);
  }

  async signInWithOtp(email: string): Promise<void> {
    if (this.isDemo()) {
      this.enterDemo();
      return;
    }

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

  async signOut(): Promise<void> {
    if (this.isDemo()) {
      this._user.set(DEMO_USER);
      return;
    }

    const client = await this.supabase();
    await client?.auth.signOut();

    this._session.set(null);
    this._user.set(null);
    await this.router.navigate(['/login']);
  }

  /** Called by the problem interceptor when the backend rejects the token. */
  onUnauthorized(): void {
    if (this.isDemo()) {
      return;
    }

    this._session.set(null);
    this._user.set(null);

    const current = this.router.url;
    const queryParams = current && current !== '/login' ? { next: current } : {};

    void this.router.navigate(['/login'], { queryParams });
  }

  private async supabase(): Promise<SupabaseClient | null> {
    if (this.client) {
      return this.client;
    }

    if (this.config.useMock || !this.config.hasSupabase) {
      return null;
    }

    this.clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(this.config.supabaseUrl, this.config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );

    this.client = await this.clientPromise;
    return this.client;
  }

  private async applySession(session: Session | null): Promise<void> {
    this._session.set(session);

    const supabaseUser = session?.user;
    if (!supabaseUser) {
      this._user.set(null);
      return;
    }

    const fallback = userFromSession(supabaseUser);
    this._user.set(fallback);

    const profile = await this.fetchProfile(fallback.id);
    if (profile) {
      this._user.set({
        ...fallback,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        status: profile.status,
      });
      return;
    }

    this._user.set({ ...fallback, needsProfile: true });
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
