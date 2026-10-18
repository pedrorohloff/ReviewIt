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
- `security/JwtFilter.java` — validates Supabase JWT via JWKS, sets `currentUserId` as request attribute
- `security/SecurityConfig.java` — Spring Security config; test profile uses `TestSecurityConfig`

## Error Handling (RFC 7807)

Global advice maps exceptions to `ProblemDetail`:
- `RecordNotFoundException` → 404
- `ForbiddenException` → 403  
- `BusinessException` → 409
- `MethodArgumentNotValidException` → 400 with field validation errors

## Database

- **Production/Dev**: PostgreSQL (Supabase). Config via `.env.properties` → `application.properties`
- **Migrations (Flyway)**: `V1__create_like_tables.sql`, `V2__create_moderation_tables.sql`, `V3__create_notification_tables.sql`
- **Tests**: Testcontainers PostgreSQL 16, `ddl-auto=create-drop` in test profile

## Security

- JWT-based auth (Supabase). `JwtFilter` validates token signature/issuer, extracts `sub` as UUID `currentUserId`.
- Profile-gated: `@Profile("!test")` for production security; `@Profile("test")` for test security config (allows easier controller testing).
- Endpoints under `/api/v1/**` require authentication by default.

## Pagination

Domains use Spring Data `Pageable` with `page` (0-based) and `pageSize` query params; responses wrapped in `*PageDTO`.

## Testing

- **Base**: `AbstractIntegrationTest` with `@ActiveProfiles("test")`, `@Transactional`, `@DirtiesContext(classMode = AFTER_CLASS)`
- **Service tests** and **Controller tests** per domain
- **Data factory**: `TestDataFactory` for consistent test data
- **Full suite**: 133 tests, all passing (run with Docker via Testcontainers)