# ReviewIt Architecture

## Overview

ReviewIt is a Spring Boot REST API following the `crud-angular-spring` pattern. It implements a layered architecture per domain: Controller → Service → Repository, with DTOs and Mappers for boundary translation, and JPA entities for persistence.

Base package: `com.pedrorohloff`

## Domains

6 core domains:
1. **Profile** — user profiles (mirroring Supabase Auth users)
2. **Post** — content reviews (books, movies, albums, series, games)
3. **Comment** — comments on posts
4. **Like** — likes on posts and comments (`PostLike`, `CommentLike`)
5. **Moderation** — reports and moderation actions
6. **Notification** — user notifications

## Layers

- **Controller** (`*Controller.java`) — REST endpoints, request validation (`@Valid`), extracts `currentUserId` from `@RequestAttribute`
- **Service** (`*Service.java`) — business logic, authorization checks (owner/moderator rules), cross-domain interactions
- **Repository** (`*Repository.java`) — Spring Data JPA interfaces
- **DTOs** (`dto/`) — request/response objects, page DTOs
- **Mapper** (`dto/mapper/`) — entity <-> DTO conversion
- **Entity** (`*.java`) — JPA entities extending `BaseEntity` (where applicable)
- **Enums/Converters** (`enums/`, `enums/converters/`) — domain enums with JPA `AttributeConverter`

## Shared Infrastructure

- `shared/model/BaseEntity.java` — base entity with common fields
- `shared/controller/ApplicationControllerAdvice.java` — global exception handling returning RFC 7807 `ProblemDetail` (404/403/409 + validation)
- `exception/BusinessException.java`, `ForbiddenException.java`, `RecordNotFoundException.java`
- `security/JwtFilter.java` — validates either a Supabase JWT via JWKS or an application HS256 JWT, then sets `currentUserId` as a request attribute
- `security/AppJwtService.java` — issues/validates 24-hour email/password tokens
- `security/SecurityConfig.java` — Spring Security config; register/login, health/docs and public `GET` reads (posts, comments, profiles) are open; everything else is authenticated; test profile uses `TestSecurityConfig`

## Error Handling (RFC 7807)

Global advice maps exceptions to `ProblemDetail`:
- `RecordNotFoundException` → 404
- `ForbiddenException` → 403  
- `BusinessException` → 409
- `MethodArgumentNotValidException` → 400 with field validation errors

## Database

- **Production/Dev**: PostgreSQL (Supabase). Config via `.env.properties` → `application.properties`
- **Migrations (reference DDL)**: `V1`–`V3` create likes/moderation/notifications, `V4` provisions Supabase profiles, `V5` creates `app_credentials` for email/password accounts
- **Tests**: Testcontainers PostgreSQL 16, `ddl-auto=create-drop` in test profile

## Security

- JWT-based auth with two accepted issuers. Supabase tokens cover magic-link/Google; application HS256 tokens cover email/password. `JwtFilter` validates the signature/issuer and extracts `sub` as UUID `currentUserId`.
- Email/password credentials live in `app_credentials`, keyed by `profile_id`; BCrypt hashes include the salt. Spring issues the local token after a successful login.
- Profile-gated: `@Profile("!test")` for production security; `@Profile("test")` for test security config (allows easier controller testing).
- Endpoints under `/api/v1/**` require authentication by default.

### Frontend auth flow

- `/login` exposes email/password, account creation, magic link and, when the
  provider is enabled, Google. The UI is in Brazilian Portuguese.
- The Spring token is stored under `reviewit.auth.token` in `localStorage` and
  restored before the app shell renders. Bootstrap catches failed session
  restoration and times out after 5 seconds, so a blocked auth chunk leaves the
  app signed out instead of blank.
- `authInterceptor` adds the current token only to API requests and skips
  `/auth/login` and `/auth/register`, so a stale token cannot break a new login.
- Supabase owns magic-link and Google sessions. The Google button is gated by
  Supabase's public `/auth/v1/settings` response (`external.google`), which
  avoids sending users to a raw provider-not-enabled page.

## Pagination

Domains use Spring Data `Pageable` with `page` (0-based) and `pageSize` query params; responses wrapped in `*PageDTO`.

## Testing

- **Base**: `AbstractIntegrationTest` with `@ActiveProfiles("test")`, `@Transactional`, `@DirtiesContext(classMode = AFTER_CLASS)`
- **Service tests** and **Controller tests** per domain
- **Data factory**: `TestDataFactory` for consistent test data
- **Full suite**: 199 tests, all passing (run with Docker via Testcontainers)