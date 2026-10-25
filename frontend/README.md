# ReviewIt — frontend

Angular 22 + Tailwind CSS 4 frontend for ReviewIt. The UI is in Brazilian
Portuguese and uses a neutral white / off-white / light-cream palette with
editorial accents, defined in `src/styles/tokens.css`.

The app works in two modes:

- **Demo (default):** no backend and no Supabase. Reviews, profiles, likes,
  comments, notifications and reports come from a deterministic local mock
  persisted in `localStorage` under `reviewit:mock:v1`.
- **Real:** the Spring Boot API for data plus three login methods:
  email/password (Spring), magic link (Supabase) and Google (Supabase OAuth).
  Configure the Supabase URL/anon key and the API URL.

## Requirements

- Node.js 22+ and npm 10+
- Optional: the Spring Boot backend on `http://localhost:8080` for real mode

## Run locally

```bash
cd frontend
npm install

# Local development file (gitignored). Blank Supabase values = demo mode.
cp src/environments/environment.development.example.ts \
   src/environments/environment.development.ts

npm start
```

Open `http://localhost:5173`. The dev server proxies `/api` to
`http://localhost:8080` when the backend is running.

## Configuration

The app resolves configuration in two layers:

1. **`/config.json` at runtime** (recommended for deployments). It is loaded
   before Angular bootstraps, with a 3-second timeout. `public/config.json`
   contains blanks in git; the deployment script overwrites the copy inside
   `dist/`.
2. **`environment.ts`** as the build-time fallback. The development
   configuration uses `environment.development.ts` through Angular's file
   replacement. Both are committed with blanks.

```json
{
  "apiBaseUrl": "https://api.example.com/api/v1",
  "supabaseUrl": "https://project-ref.supabase.co",
  "supabaseAnonKey": "public-anon-or-publishable-key"
}
```

- Blank `supabaseUrl` / `supabaseAnonKey` → demo mode.
- Non-blank Supabase values → real mode; `apiBaseUrl` must point to the API.
- `apiBaseUrl` defaults to `/api/v1` (the dev proxy path).
- Never put a Supabase `service_role` key or a database password in the
  frontend. The anon/publishable key is public by design.

### Anonymous browsing

The feed, review detail, comments and public profiles are readable without a
login. The Angular routes for `/`, `/posts/:id` and `/profile/:id` have no
`authGuard`, and the backend allows the matching `GET` requests. Writes (new or
edited reviews, likes, comments, reports) still require an authenticated session;
the UI opens a login prompt for new reviews, likes and comments, and confirming
it goes to `/login?next=<attempted-url>`.

### Login session

- **Email/password** calls `POST /auth/login` or `POST /auth/register` on the
  Spring API. The returned 24-hour HS256 JWT is stored in `localStorage` under
  `reviewit.auth.token`, restored on boot and attached as `Authorization: Bearer`
  only to API requests. Login/registration requests never carry a stale token.
- **Magic link** and **Google** use the Supabase client. Supabase persists its
  own session and `detectSessionInUrl` completes the redirect.
- On boot the app tries the local JWT first; if it is absent or invalid it falls
  back to the Supabase session. A failed auth chunk or API timeout must not block
  bootstrap: the app renders signed out.
- The Google button is shown only when Supabase's public
  `/auth/v1/settings` reports `external.google: true`. See
  [`../docs/GOOGLE_OAUTH.md`](../docs/GOOGLE_OAUTH.md) for the provider setup.

### Production build with runtime config

```bash
REVIEWIT_API_URL=https://api.example.com/api/v1 \
REVIEWIT_SUPABASE_URL=https://project-ref.supabase.co \
REVIEWIT_SUPABASE_ANON_KEY=public-anon-or-publishable-key \
npm run build:deploy
```

`build:deploy` runs `ng build` and then writes
`dist/frontend/browser/config.json`. Missing variables produce blanks, keeping
demo mode intact.

## Scripts

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm start`            | Angular dev server on port 5173 with `/api` proxy         |
| `npm run build`        | Production build in `dist/frontend/browser`               |
| `npm run build:deploy` | Build + generate `config.json` from `REVIEWIT_*` env vars |
| `npm run preview`      | Serves the production build on port 4173                  |
| `npm test`             | Vitest unit tests (single run)                            |
| `npm run test:watch`   | Vitest in watch mode                                      |
| `npm run lint`         | Angular ESLint                                            |
| `npm run e2e`          | Playwright desktop + mobile specs                         |
| `npm run format`       | Prettier across the frontend                              |

Playwright needs Chromium once per machine:

```bash
npx playwright install chromium
```

## Implemented scope

Steps 0–8 of `misc/FRONTEND_PLAN.md`:

- app shell, top bar, centered search, filter popover, avatar menu and feed;
- infinite scrolling with scroll restoration, URL-driven search/filter/sort,
  skeletons, empty/error/end states and a custom scroll rail;
- post detail with likes and paginated comments;
- create/edit review with validation and notification settings;
- email/password registration and login, Supabase magic-link and Google OAuth,
  route guards, local-token/Supabase session restoration and demo mode;
- profile pages (own and other authors) with author feeds;
- notifications with optimistic mark-as-read;
- moderation console with reports, suspend/ban/remove actions and role gates;
- accessibility (axe, keyboard, skip link, reduced motion), offline banner,
  route-level error page, responsive layouts and Lighthouse checks;
- runtime configuration for decoupled deployment.

## Architecture

- Standalone components, signals, `OnPush`, zoneless change detection.
- `core/` — API abstraction (`ReviewApi`, HTTP and mock adapters), auth,
  config, interceptors, models.
- `features/` — feed, post detail/editor, profile, notifications, moderation.
- `layout/` — app shell, top bar, avatar menu, offline banner.
- `shared/` — reusable UI and utilities.
- Component-scoped stores own page state; `FeedStore` is root-provided so
  returning from a detail page reuses loaded pages.

## Deployment

The frontend is static and deploy-ready for Vercel (a `vercel.json` with SPA
fallback is included) or Netlify. The API runs separately as a Docker container.
See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for Supabase, Render and
Vercel steps, environment variables and troubleshooting.

## Documentation

- [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) — hosting and Supabase setup.
- [`../docs/DEMO.md`](../docs/DEMO.md) — short demo script.
- [`../docs/API.md`](../docs/API.md) — backend endpoints.
- [`../docs/RUNNING.md`](../docs/RUNNING.md) — local backend and database setup.
