import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@app/core/config/app-config';
import { Profile } from '@app/core/models/profile';

export interface AppAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  email: string;
  profile: Profile;
}

export interface PasswordLoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends PasswordLoginInput {
  username: string;
}

/** Email/password endpoints owned by the Spring API. */
@Injectable({ providedIn: 'root' })
export class AppAuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

  login(input: PasswordLoginInput): Observable<AppAuthResponse> {
    return this.http.post<AppAuthResponse>(`${this.baseUrl}/auth/login`, input);
  }

  register(input: RegisterInput): Observable<AppAuthResponse> {
    return this.http.post<AppAuthResponse>(`${this.baseUrl}/auth/register`, input);
  }
}
