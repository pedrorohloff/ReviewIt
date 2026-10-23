# Development Guide

## Getting Started

### 1. Clone and configure
```bash
git clone git@github.com:pedrorohloff/ReviewIt.git
cd ReviewIt
cp .env.example .env.properties
# edit .env.properties with Supabase credentials
```

### 2. Prerequisites check
- Java 25: `java -version`
- Docker: `docker --version` (needed for tests)

### 3. Build
```bash
./mvnw clean compile
```

### 4. Run tests (Docker required)
```bash
sg docker -c './mvnw test'  # if not in docker group
./mvnw test  # if in docker group
```

### 5. Run app
```bash
./mvnw spring-boot:run
# Swagger at http://localhost:8080/swagger-ui.html
```

## Code Style & Conventions

- Package by feature/domain (not by technical layer)
- Controllers thin; Services contain business logic
- Use DTOs at API boundary; Mappers for conversion
- Validation via Bean Validation (`@Valid`, `@NotNull`, `@NotBlank`, `@Size`/`@Length` etc.)
- Exceptions thrown by services, handled globally by `ApplicationControllerAdvice`
- Return RFC 7807 `ProblemDetail` on errors
- Pagination: `page` (0-based), `pageSize` query params; return `*PageDTO`

## Adding a new endpoint

1. Define/adjust DTOs in `dto/`
2. Update Mapper if needed
3. Add repository method if query-specific
4. Implement service logic (auth checks, validation, business rules)
5. Add controller mapping with `@Valid` and `@RequestAttribute("currentUserId")` as appropriate
6. Add tests (service + controller) under `src/test/java`

## Database

- Entities use JPA annotations; avoid mixing DDL concerns in code
- Migrations live in `src/main/resources/db/migration/` (Flyway format `V{n}__*.sql`)
- Tests use `create-drop` (Testcontainers) — no migration files needed for test schema
- Production uses PostgreSQL (Supabase). Core tables require manual creation in Supabase if migrations don't cover them (see README)

## Security

- `JwtFilter` validates Supabase JWT via JWKS and sets `currentUserId`
- Production security: `SecurityConfig` active only when `!test`
- Test security: `TestSecurityConfig` active only when `test` profile
- Controllers access authenticated user via `@RequestAttribute("currentUserId")`

## Testing Tips

- Extend `AbstractIntegrationTest` for integration/controller tests (gets Testcontainers + security stubs)
- Use `TestDataFactory` for consistent test entities/DTOs
- Service unit tests can use mocks; integration tests use real DB via Testcontainers
- Run with `@DirtiesContext` only when necessary (base class uses `AFTER_CLASS` globally)

## Common Commands

```bash
# Format/check compile
./mvnw compile

# Run tests quietly
./mvnw -q test

# Run specific domain tests
./mvnw test -Dtest=*Like*Test

# Clean target
./mvnw clean

# Skip tests during package
./mvnw package -DskipTests
```

## Troubleshooting

- **Docker not available**: integration tests fail with Testcontainers errors — start Docker daemon
- **Port conflicts**: app defaults to 8080; change via `server.port` if needed
- **JWT validation fails**: check `SUPABASE_JWT_JWKS_URL` and `SUPABASE_JWT_ISSUER` in `.env.properties` for magic-link/Google sessions, and `APP_JWT_SECRET` for email/password sessions
- **App fails to start with `app.jwt.secret`**: set `APP_JWT_SECRET` to a random value of at least 32 bytes
- **DB connection fails**: verify Supabase credentials/URL and network access
- **Permission issues running with sg docker**: ensure docker group exists and your user is in it