# ReviewIt — Running, Testing & Database Setup

A practical guide to getting the ReviewIt Spring Boot application running and tested
on a fresh machine, including how to create the schema in Supabase.

> Deploying to the cloud? See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Supabase,
> Render and Vercel instructions.

---

## 1. Prerequisites

| Need | Why |
|------|-----|
| **JDK 25** | `pom.xml` sets `<java.version>25</java.version>` |
| **Docker running** | Integration tests use Testcontainers (throwaway PostgreSQL 16) |
| A **Supabase** project | The app connects to its PostgreSQL over JDBC and validates JWTs against it |

No Maven install is required — the project ships the `mvnw` / `mvnw.cmd` wrapper.

> Windows users: replace `./mvnw` with `mvnw.cmd` throughout this document.

---

## 2. Configure `.env.properties`

Spring Boot reads `optional:file:.env.properties` from the project root
(`spring.config.import=optional:file:.env.properties`). This file is **gitignored**, so
create it on every new machine by copying `.env.example`:

```properties
# Database
SUPABASE_DB_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require&user=postgres.<project-ref>
SUPABASE_DB_USERNAME=postgres.<project-ref>
SUPABASE_DB_PASSWORD=<your-database-password>

# JWT
SUPABASE_JWT_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1

# CORS (frontend origin)
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> **Security:** the DB password lives in this file. Keep it out of git (it already is)
> and never commit or share it.

---

## 3. Run the application

From the project root:

```bash
# Development run (hot reload via devtools)
./mvnw spring-boot:run

# Package and run the jar
./mvnw clean package -DskipTests
java -jar target/ReviewIt-0.0.1-SNAPSHOT.jar
```

- Runs on **http://localhost:8080**. The port comes from `server.port=${PORT:8080}`,
  so PaaS platforms can inject `PORT` without code changes.
- On success you will see `Started ReviewItApplication` in the log output.
- If `spring-boot:run` cannot find Java, set `JAVA_HOME` to a JDK 25 install first, e.g.
  `export JAVA_HOME=/path/to/jdk-25`.

The application assumes the Supabase tables already exist. If they do not, the app still
**starts** (Hibernate `ddl-auto` defaults to `none` for a non-embedded database), but every
endpoint fails with `relation ... does not exist`. See [section 5](#5-create-the-tables-in-supabase).

---

## 4. Test the application

Tests spin up their own **Testcontainers PostgreSQL 16**; they never touch your Supabase
database. The base class `AbstractIntegrationTest` configures the datasource dynamically and
builds the schema from the JPA entities inside the container, so **Docker is the only
requirement**.

```bash
# Everything
./mvnw test

# One test class
./mvnw test -Dtest=ProfileServiceTest

# One test method
./mvnw test -Dtest=PostControllerTest#shouldCreatePost

# Compile tests only (no Docker needed)
./mvnw test-compile

# Clean run
./mvnw clean test
```

### Test suite layout

| Domain | Service tests | Controller tests |
|--------|---------------|------------------|
| Profile | `ProfileServiceTest` | `ProfileControllerTest` |
| Post | `PostServiceTest` | `PostControllerTest` |
| Comment | `CommentServiceTest` | `CommentControllerTest` |
| Like | `LikeServiceTest` | `LikeControllerTest` |
| Moderation | `ReportServiceTest` | `ModerationControllerTest` |
| Notification | `NotificationServiceTest` | `NotificationControllerTest` |

Shared helpers:
- `src/test/java/com/pedrorohloff/AbstractIntegrationTest.java` — Testcontainers base class.
- `src/test/java/com/pedrorohloff/TestDataFactory.java` — entity factories for all field states.

---

## 5. Create the tables in Supabase

The repository ships Flyway-style migrations for only **part** of the schema, and Flyway is
**not wired up**, so nothing runs them automatically:

- `V1__create_like_tables.sql` → `post_likes`, `comment_likes`
- `V2__create_moderation_tables.sql` → `reports`, `moderation_actions`
- `V3__create_notification_tables.sql` → `notifications`

There is **no migration for `profiles`, `posts`, or `comments`** — that is why the Supabase
project is empty.

### Option A — SQL Editor (recommended, no code change)

In the Supabase Dashboard go to **SQL Editor → New query**, paste the block below, and click
**Run**. Order matters: the foreign keys reference one another.

```sql
-- ============================================================
-- ReviewIt full schema (PostgreSQL / Supabase)
-- Run in: Supabase Dashboard -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    avatar_url      VARCHAR(500),
    role            VARCHAR(20)  NOT NULL DEFAULT 'Regular',
    account_status  VARCHAR(20)  NOT NULL DEFAULT 'Active',
    suspended_until TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
    id             UUID PRIMARY KEY,
    author_id      UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title          VARCHAR(200)  NOT NULL,
    content_type   VARCHAR(20)   NOT NULL,
    genre          VARCHAR(255)  NOT NULL,
    content        VARCHAR(5000) NOT NULL,
    notify_enabled BOOLEAN       NOT NULL DEFAULT false,
    notify_channel VARCHAR(20)   NOT NULL DEFAULT 'None',
    updated_at     TIMESTAMP     NOT NULL DEFAULT now(),
    created_at     TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
    id         UUID PRIMARY KEY,
    post_id    UUID          NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id  UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content    VARCHAR(2000) NOT NULL,
    updated_at TIMESTAMP     NOT NULL DEFAULT now(),
    created_at TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_likes (
    id         UUID PRIMARY KEY,
    post_id    UUID      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_post_user UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_likes (
    id         UUID PRIMARY KEY,
    comment_id UUID      NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    UUID      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_comment_user UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id          UUID PRIMARY KEY,
    reporter_id UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id     UUID         REFERENCES posts(id) ON DELETE CASCADE,
    comment_id  UUID         REFERENCES comments(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'Pending',
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uk_reporter_target UNIQUE (reporter_id, post_id, comment_id),
    CONSTRAINT chk_report_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id             UUID PRIMARY KEY,
    report_id      UUID        NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    moderator_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_user_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type    VARCHAR(20) NOT NULL,
    duration_days  INTEGER,
    created_at     TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id    UUID         NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    type       VARCHAR(20)  NOT NULL,
    channel    VARCHAR(10)  NOT NULL,
    read_at    TIMESTAMP,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);
```

The `VARCHAR` default/expected values (`'Regular'`, `'Active'`, `'Pending'`, `'None'`,
`'In-App'`, etc.) match the enum converters in the code, so the application can read rows
back correctly.

### Option B — `psql` from the terminal

Save the SQL as `schema.sql`, then run:

```bash
psql "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" -f schema.sql
```

Use port **5432** (session pooler) or the direct connection for DDL. Avoid the 6543
transaction pooler, which does not handle DDL reliably.

### Option C — automate with Flyway (future improvement)

Add `org.flywaydb:flyway-core` and `flyway-database-postgresql`, then add a
`V0__create_core_tables.sql` containing the `profiles` / `posts` / `comments` DDL (the rest
already exist in `V1`–`V3`). Flyway would then create the whole schema automatically on
startup and in tests.

---

## 6. API endpoints

All endpoints live under `/api/v1`. `GET /api/v1/health`, Swagger UI and the
OpenAPI document are public; everything else requires
`Authorization: Bearer <supabase-jwt>` (`anyRequest().authenticated()`). The JWT
`sub` claim must be a **UUID** — it becomes the `currentUserId` request attribute.

```
GET    /api/v1/health

GET    /api/v1/profiles?page=0&pageSize=10
GET    /api/v1/profiles/{id}
POST   /api/v1/profiles
PUT    /api/v1/profiles/{id}
DELETE /api/v1/profiles/{id}

GET    /api/v1/posts?page=0&pageSize=10
GET    /api/v1/posts/{id}
POST   /api/v1/posts
PUT    /api/v1/posts/{id}
DELETE /api/v1/posts/{id}
PATCH  /api/v1/posts/{id}/notification-settings

GET    /api/v1/posts/{postId}/comments
GET    /api/v1/comments/{id}
POST   /api/v1/posts/{postId}/comments
PUT    /api/v1/comments/{id}
DELETE /api/v1/comments/{id}

POST   /api/v1/posts/{postId}/like
POST   /api/v1/comments/{commentId}/like

POST   /api/v1/reports
GET    /api/v1/reports?page=0&pageSize=10
POST   /api/v1/reports/{reportId}/action

GET    /api/v1/notifications?page=0&pageSize=10
PATCH  /api/v1/notifications/{id}/read
```

Example authenticated request:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/posts
```

---

## 7. Known issues / gotchas

1. **Tests are self-contained.** `AbstractIntegrationTest` sets
   `spring.jpa.hibernate.ddl-auto=create-drop` and stubs the `supabase.jwt.*` properties, so
   the suite only needs a running Docker daemon (no `.env.properties`, no Supabase).

2. **`POST /api/v1/profiles` likely fails.** `Profile.id` is `@NotNull` with no
   `@GeneratedValue`, and `ProfileMapper.toModel()` never sets an id, so the insert persists
   a null id. Profiles are meant to mirror Supabase Auth users (id = `auth.users.id`), so this
   should be assigned from the JWT `sub` or a database default/trigger.

3. **`reports` uniqueness and NULLs.** The unique constraint
   `(reporter_id, post_id, comment_id)` does not prevent duplicate reports when one of
   `post_id` / `comment_id` is NULL (PostgreSQL treats NULLs as distinct). The service checks
   for duplicates in code; a partial unique index or PostgreSQL 15's `NULLS NOT DISTINCT`
   would enforce it at the database level too.

4. **Timestamps.** The DDL uses `TIMESTAMP` (without time zone) to stay consistent with
   `V1`–`V3`. Supabase runs in UTC, so `Instant` round-trips correctly; `TIMESTAMPTZ` would
   also work if you prefer strict time-zone semantics.
