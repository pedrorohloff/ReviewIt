# ReviewIt — Deployment guide

This guide deploys ReviewIt as three independent pieces:

```text
Vercel (Angular build)  ──HTTPS──▶  Render (Spring Boot API)  ──JDBC──▶  Supabase
        │                                  │                         (Postgres + Auth)
        └──────────── Supabase Auth (magic link, JWT) ────────────────┘
```

The Angular app is static and can live on any static host. The API is a Docker
container. Supabase provides the PostgreSQL database and the identity provider.
Locally, the same split is reproduced with the Angular dev server proxying
`/api` to `localhost:8080`.

> The repository also supports a demo mode with no backend and no Supabase. If
> `supabaseUrl` / `supabaseAnonKey` are blank, the frontend uses local fixtures
> stored in `localStorage` (see `docs/DEMO.md`).

---

## 1. Supabase

### 1.1 Create the project and schema

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor → New query** and run the full schema block from
   [`RUNNING.md` §5](./RUNNING.md#5-create-the-tables-in-supabase). It creates
   `profiles`, `posts`, `comments`, `post_likes`, `comment_likes`, `reports`,
   `moderation_actions` and `notifications`.
3. Keep the project region close to the backend region to reduce latency.

Flyway is **not wired into the application**; the SQL files in
`src/main/resources/db/migration` are reference DDL only. Running the SQL block
above is the supported setup path.

### 1.2 Collect the backend settings

In **Project Settings**:

| Setting | Where | Example |
|---|---|---|
| `SUPABASE_DB_URL` | Database → Connection string → URI (use the pooler) | `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require&user=postgres.abcdefghijklmnop` |
| `SUPABASE_DB_USERNAME` | Pooler connection string user | `postgres.abcdefghijklmnop` |
| `SUPABASE_DB_PASSWORD` | Database → Database password (reset it if needed) | — |
| `SUPABASE_JWT_JWKS_URL` | API → JWT Settings → JWKS URL | `https://abcdefghijklmnop.supabase.co/auth/v1/.well-known/jwks.json` |
| `SUPABASE_JWT_ISSUER` | API → JWT Settings → issuer | `https://abcdefghijklmnop.supabase.co/auth/v1` |

Use the **session pooler** (port `5432`) rather than the transaction pooler.
HikariCP keeps prepared statements, and the transaction pooler can reject them.

The JWKS URL must be the public discovery endpoint
`https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`. The older
`/auth/v1/keys` path requires an API key header and is **not** a drop-in
replacement. Both RSA and ECDSA keys are supported by the backend.

If the project still uses the **legacy HS256 shared secret**, migrate it to an
asymmetric signing key in **Authentication → JWT Keys** (RSA or ECC). The
backend verifies signatures with the public JWKS and does not accept HS256.

### 1.3 Configure authentication URLs

In **Authentication → URL Configuration**:

- **Site URL:** `https://<your-frontend-domain>`
- **Redirect URLs:** `https://<your-frontend-domain>/login` and
  `http://localhost:5173/login` for local development.

The frontend sends `emailRedirectTo: <origin>/login`, so the magic link returns
to the login page and `AuthService` restores the session. The default Supabase
email service is rate-limited and intended for development; configure custom
SMTP before sharing the app widely.

### 1.4 Automatic profile provisioning

Sign-in creates a Supabase `auth.users` row. The `profiles` row is created
automatically by the database trigger installed with
[`V4__provision_profiles_on_signup.sql`](../src/main/resources/db/migration/V4__provision_profiles_on_signup.sql):

- the trigger runs after every insert into `auth.users`;
- the new `profiles` row uses the **same UUID** as the auth user;
- the username is derived from `user_metadata.username`, `full_name`, or the email local
  part, with a numeric suffix if it collides;
- `profiles.onboarded` starts as `false`, so the frontend shows `/onboarding` once;
- existing auth users are backfilled by the same migration.

There is no manual SQL step. If a project was created before this migration, run the V4
file once in **SQL Editor → New query**. `role` is `Regular`, `Moderator` or `Admin`;
`account_status` is `Active`, `Suspended` or `Banned`.

If the trigger is missing, the frontend still offers onboarding and
`POST /api/v1/profiles` creates the row with the authenticated `sub`. Without a profile,
creating posts/comments and opening the profile page fail because of the foreign keys.

---

## 2. Backend on Render

The repository includes a multi-stage [`Dockerfile`](../Dockerfile) and a
[`render.yaml`](../render.yaml) blueprint. The image uses the Maven wrapper and
Eclipse Temurin 25, and runs as a single Spring Boot jar.

### Option A — Blueprint (recommended)

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository.
3. Render reads `render.yaml`. Fill the `sync: false` variables with the values
   from section 1.2.
4. Set `APP_CORS_ALLOWED_ORIGINS` to your Vercel domain. You can add a preview
   pattern while testing:
   `https://reviewit.vercel.app,https://*.vercel.app`. Remove the wildcard once
   preview deployments are no longer needed.
5. Deploy and wait for the health check at `/api/v1/health` to pass.

### Option B — Manual web service

- Runtime: **Docker**, Dockerfile path `./Dockerfile`, health check path
  `/api/v1/health`.
- Add the same environment variables listed below.
- Set `JAVA_OPTS=-XX:MaxRAMPercentage=75` (already in `render.yaml`).

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_DB_URL` | yes | JDBC URL, including `sslmode=require` |
| `SUPABASE_DB_USERNAME` | yes | Pooler user (`postgres.<project-ref>`) |
| `SUPABASE_DB_PASSWORD` | yes | Database password |
| `SUPABASE_JWT_JWKS_URL` | yes | JWT public keys |
| `SUPABASE_JWT_ISSUER` | yes | Expected `iss` claim |
| `APP_CORS_ALLOWED_ORIGINS` | yes | Comma-separated frontend origins |
| `SPRING_JPA_SHOW_SQL` | no | `false` in production (default) |
| `JAVA_OPTS` | no | JVM memory flags |

`PORT` is injected by Render; `application.properties` maps it with
`server.port=${PORT:8080}`. Do not set it manually.

### Verify the backend

```bash
curl -i https://<backend>.onrender.com/api/v1/health
# HTTP/1.1 200, {"status":"ok"}

curl -i -X OPTIONS https://<backend>.onrender.com/api/v1/posts \
  -H "Origin: https://<frontend>.vercel.app" \
  -H "Access-Control-Request-Method: GET"
# Access-Control-Allow-Origin: https://<frontend>.vercel.app
```

Render's free plan sleeps after inactivity; the first request can take a while.
If the health check fails, inspect the deploy logs for database/JWT property
errors before changing code.

### Other platforms

The same Dockerfile works on Railway, Fly.io and any container host. Configure
the same variables and expose the port from `PORT`. If the platform does not
provide a health-check path, use `/api/v1/health`.

---

## 3. Frontend on Vercel

The Angular build is fully static. Runtime settings live in
`dist/frontend/browser/config.json`, generated after the build by
`frontend/scripts/write-config.mjs`.

### 3.1 Import the project

1. In Vercel, **Add New → Project** and select the repository.
2. Set **Root Directory** to `frontend`.
3. `frontend/vercel.json` already sets:
   - Build Command: `npm run build:deploy`
   - Output Directory: `dist/frontend/browser`
   - SPA fallback: serve existing files, otherwise `index.html`
4. Add the environment variables:

| Variable | Value |
|---|---|
| `REVIEWIT_API_URL` | `https://<backend>.onrender.com/api/v1` |
| `REVIEWIT_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `REVIEWIT_SUPABASE_ANON_KEY` | Supabase **anon** public key (new projects may show a `sb_publishable_...` key) |

5. Deploy.

The anon/publishable key is public by design and is shipped to the browser. **Never** put the
Supabase `service_role` key or the database password in the frontend.

`build:deploy` runs `ng build` first and only then writes `config.json`, so the
file is included in the uploaded output without polluting `public/` with
environment-specific values. If a variable is missing, the file is written with
blanks and the app falls back to `environment.ts` (demo mode if Supabase is
blank).

### 3.2 Close the loop

After Vercel gives you a domain:

1. Add it to `APP_CORS_ALLOWED_ORIGINS` on Render and redeploy the API.
2. Add `https://<domain>/login` to the Supabase redirect URLs (section 1.3).
3. Open the site and sign in with a magic link.

### Netlify alternative

If you prefer Netlify, set the base directory to `frontend`, build command to
`npm run build:deploy`, publish directory to `dist/frontend/browser`, and add a
redirect file:

```text
/*  /index.html  200
```

Add the same `REVIEWIT_*` environment variables.

### Why runtime config?

A single build can be promoted between environments by replacing `config.json`;
the API URL and Supabase keys are not baked into the JavaScript bundle. The file
is fetched once before Angular bootstraps, with a 3-second timeout. If it is
missing or invalid, the app falls back to `environment.ts`, so local demo mode
and the existing tests keep working.

---

## 4. Local two-process development

```bash
# Terminal 1 — backend (needs .env.properties, see docs/RUNNING.md)
./mvnw spring-boot:run

# Terminal 2 — frontend
cd frontend
npm install
npm start
```

`proxy.conf.json` forwards `/api` to `http://localhost:8080`, so no CORS is
needed locally. To use a real Supabase login locally, put the URL and anon key
in `src/environments/environment.development.ts` (gitignored) or in
`public/config.json`. Leave them blank to stay in demo mode.

---

## 5. Deployment checklist

- [ ] Supabase schema executed; tables present in Table Editor.
- [ ] `V4__provision_profiles_on_signup.sql` executed; the `on_auth_user_created` trigger exists.
- [ ] Seed data loaded with `seed/` if the feed should start populated (see [`seed/README.md`](../seed/README.md)).
- [ ] New user receives a `profiles` row automatically (no manual insert).
- [ ] Backend health check returns 200.
- [ ] CORS preflight returns the frontend origin.
- [ ] Vercel build succeeds and `config.json` contains the production values.
- [ ] Magic link returns to `/login` and the session is restored.
- [ ] Feed loads real posts; like and comment persist.
- [ ] Deep link (for example `/posts/<id>`) loads directly, not 404.
- [ ] No `service_role` key, DB password or JWT secret in the frontend bundle.
- [ ] Demo mode still works locally with blank Supabase values.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `401` on every API call | Missing/expired token, wrong issuer, or JWKS URL | Check the browser request `Authorization` header; verify `SUPABASE_JWT_ISSUER` and the JWKS URL |
| Tokens are HS256 / no keys in JWKS | Legacy shared-secret signing | Migrate the project to an RSA or ECC signing key; the backend only accepts asymmetric JWTs |
| Backend logs `No API key found` for JWKS | `SUPABASE_JWT_JWKS_URL` uses `/auth/v1/keys` | Use `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| CORS error in the browser | Origin not in `APP_CORS_ALLOWED_ORIGINS`, or API redeployed without it | Add the exact origin (scheme + host, no trailing slash) and redeploy |
| Magic link goes to `localhost` | Supabase Site URL / Redirect URLs still point to dev | Update Authentication → URL Configuration |
| `relation "profiles" does not exist` | Schema block not executed | Run [`RUNNING.md` §5](./RUNNING.md#5-create-the-tables-in-supabase) |
| `password authentication failed` | Wrong pooler username (must include project ref) or password | Copy the URI exactly; set `SUPABASE_DB_USERNAME` |
| `prepared statement ... already exists` | Transaction pooler (port 6543) | Use the session pooler on port 5432 |
| App silently uses demo data | `config.json` missing/blank, or Supabase env vars absent | Re-run `npm run build:deploy`; check the deployed `/config.json` |
| `Profile not found with id: …` when publishing | `profiles` row missing (trigger not installed or backfill skipped) | Run `V4__provision_profiles_on_signup.sql`; the auth user keeps the same UUID |
| Deep links 404 | SPA fallback not applied | Keep `frontend/vercel.json` or the Netlify `_redirects` rule |

---

## 7. Known limitations

- **Free hosting cold starts.** Render free instances sleep; the first request
  after idle is slow.
- **Flyway is not executed.** The SQL migration files are reference DDL; the
  schema is created through the Supabase SQL Editor.
- **Mobile Lighthouse performance** is 77 under simulated throttling on the
  static preview server (desktop local is 99). See the Step 8 log.
- **JWKS is cached for five minutes** and refreshed when an unknown `kid`
  arrives, throttled to one forced refresh every 30 seconds. A key rotation can
  therefore add one extra round trip to the first request after rotation.
- **Single-jar deployment is not implemented.** The frontend is served by the
  static host; no SPA fallback is needed in Spring. The dev proxy remains the
  local development path.
