# ReviewIt

A Spring Boot 3/4 (Spring Boot 4.1.1) REST API for a review platform covering books, movies, albums, series and games.

Built following the `crud-angular-spring` (Loiane Groner) architectural pattern. The implementation covers 6 core domains: **Profile**, **Post**, **Comment**, **Like**, **Moderation** and **Notification**.

## Tech Stack

- **Java 25**
- **Spring Boot 4.1.1** (WebMVC, Validation, Security, Data JPA)
- **PostgreSQL** (Supabase in production/development as configured)
- **Flyway** migrations (for Like/Moderation/Notification tables; core tables documented for Supabase setup)
- **Testcontainers** + PostgreSQL 16 for integration tests
- **Lombok**, **springdoc-openapi** (Swagger UI), **Nimbus JOSE JWT** (Supabase JWKS validation)
- **Maven** (with `mvnw` wrapper)
- **Angular 22 + Tailwind CSS 4** frontend in `frontend/` (demo mode available)

## Project structure

The code is organized by domain under `src/main/java/com/pedrorohloff`:
- `profile/`, `post/`, `comment/`, `like/`, `moderation/`, `notification/` — domain packages (entity, repository, service, controller, dto, mapper, enums)
- `security/` — JWT filter and security configuration
- `shared/` — base entities, exceptions, advice, config (including OpenAPI)
- `exception/` — domain exceptions (`BusinessException`, `RecordNotFoundException`, `ForbiddenException`)

## Prerequisites

- JDK 25
- Docker (required to run integration tests — Testcontainers uses it)
- Supabase project (for running the application against a real PostgreSQL instance; tests don't require Supabase)

> On Windows use `mvnw.cmd` instead of `./mvnw`.

## Configuration

Spring Boot reads `.env.properties` from the project root (see `spring.config.import=optional:file:.env.properties`). Copy `.env.example` to `.env.properties` and fill in values:

```properties
SUPABASE_DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?user=postgres.<project-ref>
SUPABASE_DB_PASSWORD=<your-database-password>
SUPABASE_JWT_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/keys
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1
```

## Running the application

```bash
# Run in development mode
./mvnw spring-boot:run

# Build and run
./mvnw clean package -DskipTests
java -jar target/ReviewIt-0.0.1-SNAPSHOT.jar
```

App runs at `http://localhost:8080`.

## Running tests

Integration tests use Testcontainers and create/drop schema in an ephemeral PostgreSQL container. **Docker must be running**.

```bash
# Run all tests (needs docker group access on some setups)
sg docker -c './mvnw test'

# Or if already in docker group
./mvnw test

# Run specific test class/method
./mvnw test -Dtest=PostControllerTest#shouldCreatePost

# Compile only
./mvnw test-compile
```

Current test suite: **133 tests**, all passing.

## Running the frontend

The Angular app lives in `frontend/`. Node.js 22+ and npm 10+ are required.

```bash
cd frontend
npm install

# Local development file (gitignored). Blank Supabase values keep demo mode on.
cp src/environments/environment.development.example.ts \
   src/environments/environment.development.ts

npm start
```

The dev server runs at `http://localhost:5173` and proxies `/api` to the backend at
`http://localhost:8080`. The current feed uses local fixtures and does not require
the backend to be running.

```bash
npm test          # Vitest unit tests
npm run lint      # Angular ESLint
npm run build     # production build in dist/frontend/browser
npm run e2e       # Playwright desktop + mobile (install Chromium once)
```

See `frontend/README.md` and `docs/API.md` for details.

## Database schema (Supabase setup)

The app uses Flyway migrations for parts of the schema:
- `V1__create_like_tables.sql` — `post_likes`, `comment_likes`
- `V2__create_moderation_tables.sql` — `reports`, `moderation_actions`
- `V3__create_notification_tables.sql` — `notifications`

Core tables (`profiles`, `posts`, `comments`) need to exist in Supabase for the app to run. The full schema is documented in `misc/RUNNING.md` (historical) and can be recreated from the SQL block there. Alternatively create via Supabase SQL Editor using the schema from commit history.

For full setup details see the original `RUNNING.md` content captured in git history (`git show 56b37f7:RUNNING.md`).

## API Documentation (Swagger)

With the app running, access the OpenAPI UI at:

- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

All endpoints (except those excluded by security config in test profile) require `Authorization: Bearer <Supabase JWT>`. Error responses follow RFC 7807 (`ProblemDetail`).

## Key endpoints

Base path: `/api/v1`

| Domain | Endpoints |
|---|---|
| Profile | `GET/POST/PUT/DELETE /profiles`, pagination with `page`, `pageSize` |
| Post | `GET/POST/PUT/DELETE /posts`, `PATCH /posts/{id}/notification-settings`, pagination |
| Comment | `GET /posts/{postId}/comments`, `GET/POST/PUT/DELETE /comments` (nested under posts where appropriate) |
| Like | `POST /posts/{postId}/like`, `POST /comments/{commentId}/like` (toggle) |
| Moderation/Reports | `POST /reports`, `GET /reports?page=0&pageSize=10`, `POST /reports/{reportId}/action` |
| Notification | `GET /notifications?page=0&pageSize=10`, `PATCH /notifications/{id}/read` |

All authenticated endpoints expect `currentUserId` from the JWT `sub` claim (exposed as `@RequestAttribute`).

## Testing notes

- `AbstractIntegrationTest` (`@ActiveProfiles("test")`) uses Testcontainers, sets `ddl-auto=create-drop`, and provides JWT/security stubs.
- Security is profile-gated: production (`!test`) enables JWT security; test profile uses `TestSecurityConfig` for easier controller testing.
- `@Transactional` + `@DirtiesContext(classMode = AFTER_CLASS)` ensure proper test isolation.

## License

This is an educational/project implementation. See repository for details.