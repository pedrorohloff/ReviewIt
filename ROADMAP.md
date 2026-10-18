# Roadmap — ReviewIt

Roadmap do projeto, derivado de `misc/status-report-reviewit.md`
("Lista de Tarefas para Finalizar o Projeto" + "Ordem Recomendada de Execução").

**Fases concluídas: 8/9** — a última fase (Fase 9) é a fase atual.

---

## Visão Geral das Fases

| # | Fase | Origem (status report) | Status |
|---|------|------------------------|--------|
| 1 | Infraestrutura | Seção 1 — Correções na Infraestrutura Existente | ✅ Concluída |
| 2 | Segurança e Autenticação | Seção 8 — Segurança e Autenticação | ✅ Concluída |
| 3 | Correções nos Domínios Existentes (Comment, Post, Profile) | Seções 2, 3 e 4 | ✅ Concluída |
| 4 | Like (criação completa) | Seção 5 — Domínio Like | ✅ Concluída |
| 5 | Moderation (criação completa) | Seção 6 — Domínio Moderation | ✅ Concluída |
| 6 | Notification (criação completa) | Seção 7 — Domínio Notification | ✅ Concluída |
| 7 | Banco de Dados | Seção 9 — Banco de Dados | ✅ Concluída |
| 8 | Testes | Seção 10 — Testes | ✅ Concluída |
| 9 | **Documentação e Finalização** | Seção 11 — Documentação e Finalização | 🚧 **Pendente (fase atual)** |

---

## Fases Concluídas (1–8)

### ✅ Fase 1 — Infraestrutura
- `BusinessException` (409 Conflict) em `com.pedrorohloff.exception`
- `RecordNotFoundException` com construtor `(String entity, Object id)`
- `ApplicationControllerAdvice` (`shared.controller`) retorna `ProblemDetail` (RFC 7807)
- `FieldValidationError` para erros de validação de campos

### ✅ Fase 2 — Segurança e Autenticação
- `JwtFilter` com validação real de JWT via JWKS do Supabase (nimbus-jose-jwt)
- `SecurityConfig` com perfis `test` / `!test`
- `currentUserId` extraído do token e exposto como `@RequestAttribute`

### ✅ Fase 3 — Correções nos Domínios Existentes
- **Comment**: estende `BaseEntity`, Bean Validation, `CommentRequestDTO`, `CommentPageDTO`, paginação, mapper com `ProfileMapper`
- **Post**: paginação (`PostPageDTO`), autenticação, verificação de autor e de suspensão/banimento, `PATCH /{id}/notification-settings`
- **Profile**: paginação (`ProfilePageDTO`), autenticação, verificação de autor

### ✅ Fase 4 — Like
- Entidades `PostLike` e `CommentLike` com `@UniqueConstraint` (`uk_post_user`, `uk_comment_user`)
- Repositórios, `ToggleLikeDTO`, `LikeController` e `LikeService` (toggle + contagem)

### ✅ Fase 5 — Moderation
- Enums `ReportStatus` e `ActionType` com converters
- Entidades `Report` e `ModerationAction`, repositórios, DTOs e mappers
- `ModerationController` e `ModerationService` (relatórios + ações de moderação)

### ✅ Fase 6 — Notification
- Enums `NotificationType` e `DeliveryChannel` com converters
- Entidade `Notification`, repositório, DTOs e mapper
- `NotificationController` e `NotificationService` (listagem + marcação como lida)

### ✅ Fase 7 — Banco de Dados
- Flyway: `V1__create_like_tables.sql`, `V2__create_moderation_tables.sql`, `V3__create_notification_tables.sql`
- Constraints: `uk_post_user`, `uk_comment_user`, check constraint em `reports`
- `application.properties` apontando para PostgreSQL (Supabase) via `.env.properties`

### ✅ Fase 8 — Testes
- Testes de integração para todos os domínios (Profile, Post, Comment, Like, Moderation, Notification, Security)
- Infra: `AbstractIntegrationTest` com `@ActiveProfiles("test")`, `@Transactional`, `@DirtiesContext`
- Resultado: `Tests run: 133, Failures: 0, Errors: 0` (`sg docker -c './mvnw test'`)

---

## 🚧 Fase 9 (última) — Documentação e Finalização

> Origem: seção "11. Documentação e Finalização" de `misc/status-report-reviewit.md`,
> complementada com o material de `misc/diagramas-reviewit-updated.md`,
> `misc/entidades-dtos-reviewit-updated.md` e `misc/status-report-reviewit.md`.

### 9.1 README.md
- [ ] Criar `README.md` na raiz do repo com:
  - [ ] Visão geral do projeto (plataforma de reviews de livros, filmes, álbuns, séries e jogos)
  - [ ] Stack (Spring Boot 4.1.1, Java 25, PostgreSQL/Supabase, Flyway, Testcontainers)
  - [ ] Pré-requisitos e setup (`.env` / `.env.properties`, variáveis `SUPABASE_*`)
  - [ ] Como rodar a aplicação (`./mvnw spring-boot:run`)
  - [ ] Como rodar os testes (docker necessário: `sg docker -c './mvnw test'`)
  - [ ] Guia do esquema SQL/Supabase (conteúdo do antigo `RUNNING.md`, removido no commit `a4fa2dc`)
  - [ ] Sumário dos 6 domínios (Profile, Post, Comment, Like, Moderation, Notification)

### 9.2 Documentação da API (OpenAPI/Swagger)
- [ ] Adicionar dependência `springdoc-openapi-starter-webmvc-ui` no `pom.xml`
- [ ] Configurar `OpenAPI`/`OpenApiConfig` (título, versão, descrição, server)
- [ ] Documentar endpoints por domínio:
  - [ ] Profile: CRUD + paginação
  - [ ] Post: CRUD + paginação + `notification-settings`
  - [ ] Comment: CRUD paginado
  - [ ] Like: toggle para posts e comentários
  - [ ] Report: criação e listagem
  - [ ] Moderation: aplicação de ações
  - [ ] Notification: listagem e mark-as-read
- [ ] Descrever autorização (Bearer JWT / Supabase JWKS) no Swagger
- [ ] Mapear respostas de erro RFC 7807 (`ProblemDetail`) e `FieldValidationError`

### 9.3 CI/CD
- [ ] Criar workflow GitHub Actions (`.github/workflows/ci.yml`):
  - [ ] Build + testes em push/PR para `main` (com serviço Docker para Testcontainers)
  - [ ] Cache do Maven
- [ ] (Opcional) Deploy automático / health check via Actuator

### 9.4 Documento de arquitetura (opcional)
- [ ] Publicar/adaptar os diagramas de `misc/` (DER, componentes, sequência, estados, classes) em `docs/` — `misc/` está no `.gitignore`

### Critérios de aceite
- README suficiente para um novo desenvolvedor subir o projeto e rodar os testes
- Swagger acessível em `/swagger-ui.html` documentando todos os endpoints
- CI verde no GitHub para o branch `main`
