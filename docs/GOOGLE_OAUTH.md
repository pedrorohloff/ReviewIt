# Google sign-in with Supabase

ReviewIt uses **Supabase Auth** as the OAuth broker for Google. The Angular app
never sees the Google client secret: it only calls
`supabase.auth.signInWithOAuth({ provider: 'google' })`; Supabase redirects to
Google, receives the callback, and returns a Supabase session to `/login`.

The login page checks Supabase's public `/auth/v1/settings` endpoint before
showing the **Continuar com Google** button. While the provider is disabled the
button is hidden, so a click cannot end on a raw Supabase error page.

> The secret below belongs in the Supabase dashboard only. Never commit it to
> the repository or put it in a Vercel environment variable.

---

## 1. Create the Google OAuth client

1. Open <https://console.cloud.google.com/> and create (or select) a project,
   for example `reviewit-oauth`.
2. Open **Google Auth Platform** (also shown as **APIs & Services → OAuth
   consent screen** in some accounts) and click **Get started**.
   - App name: `ReviewIt`
   - User support email: your e-mail
   - Audience: **External**
   - Developer contact e-mail: your e-mail
3. In **Data Access**, keep the default scopes: `openid`, `email`, `profile`.
4. In **Audience → Test users**, add the Google account you will use to test
   while the app is in **Testing**. (Publish the app later if you want any
   Google account to sign in.)
5. Go to **Clients → Create client**.
   - Application type: **Web application**
   - Name: `ReviewIt Web`
   - **Authorized JavaScript origins**
     - `https://review-it-mocha.vercel.app`
     - `http://localhost:5173`
   - **Authorized redirect URIs**
     - `https://vkicdzhdelcenjaibwoq.supabase.co/auth/v1/callback`
6. Click **Create** and copy the **Client ID** and **Client secret**.

The redirect URI is Supabase's callback, not the Vercel domain. Google sends the
user there; Supabase then redirects to the app's `/login` page.

---

## 2. Enable Google in Supabase

1. Open the Supabase dashboard for project `vkicdzhdelcenjaibwoq`.
2. Go to **Authentication → Providers → Google**.
3. Enable the provider and paste the **Client ID** and **Client secret** from
   Google Cloud.
4. Confirm that Supabase shows this callback URL:
   `https://vkicdzhdelcenjaibwoq.supabase.co/auth/v1/callback`
5. Save.

Then open **Authentication → URL Configuration**:

- **Site URL:** `https://review-it-mocha.vercel.app`
- **Redirect URLs:**
  - `https://review-it-mocha.vercel.app/login`
  - `http://localhost:5173/login`

Both entries are needed for production and local development. Supabase may take
a minute to propagate the provider change.

---

## 3. Verify

1. Open <https://review-it-mocha.vercel.app/login>.
2. The **Continuar com Google** button appears after the settings check returns
   `external.google: true`.
3. Click it, choose the Google account, and return to `/login`.
4. For a first-time user, the `V4` database trigger creates the `profiles` row
   with the same UUID; the app then sends the user to `/onboarding`.
5. For an existing user, the app goes straight to the feed.

You can inspect the provider flags without opening the app:

```bash
curl -s https://vkicdzhdelcenjaibwoq.supabase.co/auth/v1/settings \
  -H "apikey: <SUPABASE_ANON_OR_PUBLISHABLE_KEY>" | jq '.external.google'
# true
```

---

## 4. Local development

The local app is served from `http://localhost:5173`. Add both to Google Cloud
and Supabase:

| Place | Value |
|---|---|
| Google authorized JavaScript origin | `http://localhost:5173` |
| Google authorized redirect URI | `https://vkicdzhdelcenjaibwoq.supabase.co/auth/v1/callback` |
| Supabase redirect URL | `http://localhost:5173/login` |

If you use `npm run preview` (port 4173), add
`http://localhost:4173/login` to Supabase as well. For Vercel preview
deployments, either test the canonical production domain or add the preview
pattern to **Redirect URLs**.

Then put the Supabase URL and anon/publishable key in
`frontend/src/environments/environment.development.ts` (gitignored) and run the
backend with `.env.properties`.

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Unsupported provider: provider is not enabled` | Google is not enabled/saved in Supabase | Enable it in **Authentication → Providers → Google** |
| Button does not appear | `/auth/v1/settings` still returns `external.google: false` | Save the provider again and reload; check the browser console for a failed settings request |
| `redirect_uri_mismatch` | Google's redirect URI differs from Supabase's callback | Use exactly `https://<project-ref>.supabase.co/auth/v1/callback` |
| `Access blocked: ... has not completed verification` | Consent screen is in Testing and the account is not a test user | Add the account under **Audience → Test users**, or publish the app |
| Returns to `/login` without a session | `/login` is missing from Supabase **Redirect URLs** | Add the exact origin + `/login` |
| Google login reaches the API but profile pages fail | `V4` trigger missing or profile not provisioned | Run `V4__provision_profiles_on_signup.sql`, or let `/onboarding` create the profile |

---

## 6. Security notes

- The Google **client secret** stays in Supabase. The Angular bundle contains
  only the Supabase URL and the public anon/publishable key.
- OAuth sessions use Supabase's access token; email/password sessions use the
  application's HS256 JWT. The backend accepts both because `JwtFilter` selects
  the verifier by issuer.
- The app stores the Supabase session using `@supabase/supabase-js` and the local
  email/password token under `reviewit.auth.token` in `localStorage`. Do not add
  other secrets to that storage.
- No extra Vercel or Render environment variable is needed for Google OAuth.
