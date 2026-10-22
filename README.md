# ReviewIt

A review platform for books, movies, albums, series and games. The backend is a
Spring Boot 4.1.1 REST API (Java 25) covering **Profile**, **Post**, **Comment**,
**Like**, **Moderation** and **Notification**. The frontend is an Angular 22 +
Tailwind CSS 4 app in `frontend/` that runs in demo mode without any backend or
against Supabase Auth + the API.

## Tech stack

- **Backend:** Java 25, Spring Boot 4.1.1 (WebMVC, Validation, Security, Data
  JPA), PostgreSQL (Supabase), Lombok, springdoc-openapi, Nimbus JOSE JWT
- **Frontend:** Angular 22 (standalone, signals, zoneless), Tailwind CSS 4,
  Vitest, Playwright, axe-core
- **Tests:** Testcontainers + PostgreSQL 16 for backend integration tests
- **Build:** Maven wrapper (`mvnw`), npm 10

## Project structure

```text
src/main/java/com/pedrorohloff/
  profile/ post/ comment/ like/ moderation/ notification/   domain packages
  security/        JWT filter, security config, CORS
  shared/          base entities, exceptions, advice, config, health controller
  exception/       domain exceptions
frontend/          Angular app
docs/              API, database/local setup, deployment, demo script
```

## Prerequisites

- JDK 25
- Docker (backend integration tests use Testcontainers)
- A Supabase project for running against real PostgreSQL and Supabase Auth
- Node.js 22+ and npm 10+ for the frontend

> On Windows use `mvnw.cmd` instead of `./mvnw`.

## Backend configuration

Spring Boot reads `.env.properties` from the project root
(`spring.config.import=optional:file:.env.properties`). Copy `.env.example` to
`.env.properties` and fill in the values:

| Variable | Purpose |
|---|---|
| `SUPABASE_DB_URL` | JDBC URL, preferably the session pooler with `sslmode=require` |
| `SUPABASE_DB_USERNAME` | Pooler user, e.g. `postgres.<project-ref>` |
| `SUPABASE_DB_PASSWORD` | Database password |
| `SUPABASE_JWT_JWKS_URL` | Supabase JWKS endpoint |
| `SUPABASE_JWT_ISSUER` | Expected JWT `iss` claim |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (default `http://localhost:5173`) |
| `SPRING_JPA_SHOW_SQL` | `false` by default; set `true` only when debugging SQL |

Hosting platforms inject `PORT`; the app maps it with `server.port=${PORT:8080}`.
The backend accepts both RSA and ECDSA Supabase signing keys and caches the JWKS
for five minutes, refreshing it (throttled) when an unknown `kid` arrives. Legacy HS256
shared-secret tokens are not accepted; use an asymmetric signing key.

## Running the backend

```bash
./mvnw spring-boot:run

# or package and run
./mvnw clean package -DskipTests
java -jar target/ReviewIt-0.0.1-SNAPSHOT.jar
```

The API starts at `http://localhost:8080`. The database schema must exist in
Supabase first; see [`docs/RUNNING.md`](docs/RUNNING.md#5-create-the-tables-in-supabase).

## Running the frontend

```bash
cd frontend
npm install

# Local development file (gitignored). Blank Supabase values = demo mode.
cp src/environments/environment.development.example.ts \
   src/environments/environment.development.ts

npm start
```

Open `http://localhost:5173`. In demo mode the feed, profiles, likes, comments,
notifications and moderation console use a deterministic local mock; no backend
is required. With Supabase values configured, the app uses Supabase Auth and the
API (the dev server proxies `/api` to `localhost:8080`).

```bash
npm test              # Vitest unit tests
npm run lint          # Angular ESLint
npm run build         # production build in dist/frontend/browser
npm run build:deploy  # build + runtime config from REVIEWIT_* env vars
npm run e2e           # Playwright desktop + mobile (install Chromium once)
```

See [`frontend/README.md`](frontend/README.md) for architecture and runtime
configuration.

## Deployment

The recommended split is:

- **Supabase** — PostgreSQL + Auth
- **Render** — Spring Boot API using the included `Dockerfile` / `render.yaml`
- **Vercel** — Angular static build with SPA fallback (`frontend/vercel.json`)

Step-by-step instructions, environment variables, CORS, Supabase redirect URLs
and troubleshooting are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). A short
walkthrough for demos is in [`docs/DEMO.md`](docs/DEMO.md).

## Database schema (Supabase)

The repository contains reference SQL files for the like, moderation and
notification tables, but **Flyway is not wired into the application**. The
complete schema, including `profiles`, `posts` and `comments`, is in
[`docs/RUNNING.md` §5](docs/RUNNING.md#5-create-the-tables-in-supabase) and is
applied once through the Supabase SQL Editor.

## API documentation

With the app running:

- Swagger UI: <http://localhost:8080/swagger-ui.html>
- OpenAPI JSON: <http://localhost:8080/v3/api-docs>
- Health probe: <http://localhost:8080/api/v1/health>

`/api/v1/health`, Swagger UI and the OpenAPI document are public. Every other
endpoint requires `Authorization: Bearer <Supabase JWT>`. Errors follow RFC 7807
(`ProblemDetail`). See [`docs/API.md`](docs/API.md) for the full endpoint list.

## Running tests

Backend tests use Testcontainers; Docker must be running.

```bash
./mvnw test
./mvnw test -Dtest=PostControllerTest#shouldCreatePost
./mvnw test-compile
```

The suite includes service and controller integration tests plus unit tests for
CORS, the health endpoint and JWT verifier selection. Frontend unit tests and the
Playwright suite are documented in `frontend/README.md`.

## Key endpoints

Base path: `/api/v1`

| Domain | Endpoints |
|---|---|
| Health | `GET /health` (public) |
| Profile | `GET/POST/PUT/DELETE /profiles`, pagination with `page`, `pageSize` |
| Post | `GET/POST/PUT/DELETE /posts`, `PATCH /posts/{id}/notification-settings`, pagination |
| Comment | `GET /posts/{postId}/comments`, `GET/POST/PUT/DELETE /comments` |
| Like | `POST /posts/{postId}/like`, `POST /comments/{commentId}/like` (toggle) |
| Moderation/Reports | `POST /reports`, `GET /reports?page=0&pageSize=10`, `POST /reports/{reportId}/action` |
| Notification | `GET /notifications?page=0&pageSize=10`, `PATCH /notifications/{id}/read` |

Authenticated endpoints expect the current user in the JWT `sub` claim, exposed
as `@RequestAttribute("currentUserId")`.

## Known limitations

- Profiles are provisioned automatically by the `auth.users` trigger in
  `V4__provision_profiles_on_signup.sql`; first-time users complete `/onboarding`.
- Flyway migrations are reference DDL only; the schema is applied via SQL.
- The single-jar deployment is not implemented; the frontend is served
  statically and the backend runs separately.

## License

This is an educational/project implementation. See repository for details.
