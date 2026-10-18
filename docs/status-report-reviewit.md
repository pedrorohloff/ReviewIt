# Relatório de Status do Projeto ReviewIt

## Visão Geral

O projeto **ReviewIt** é uma API Spring Boot 3+ (na verdade 4.1.1) para uma plataforma de reviews de livros, filmes, álbuns, séries e jogos. A especificação nos documentos `misc/` define uma arquitetura baseada no padrão `crud-angular-spring` (Loiane Groner) com 6 domínios: **Profile**, **Post**, **Comment**, **Like**, **Moderation** e **Notification**.

---

## Estado Atual vs. Especificação

### Domínios Implementados

| Domínio | Status | Observações |
|---------|--------|-------------|
| **Profile** | Parcial | Entidade, DTOs, Mapper, Enums e Converters existem. Faltam: paginação, endpoint de notificação settings |
| **Post** | Parcial | Entidade, DTOs, Mapper, Enums e Converters existem. Faltam: paginação, autenticação, endpoint de notification settings |
| **Comment** | Parcial | Entidade e DTO básico existem. Faltam: `CommentRequestDTO`, `CommentPageDTO`, paginação, autenticação, mapper com `ProfileMapper` |
| **Like** | Não implementado | Nenhum arquivo existe |
| **Moderation** | Não implementado | Nenhum arquivo existe |
| **Notification** | Não implementado | Nenhum arquivo existe |

### Infraestrutura

| Componente | Status | Observações |
|------------|--------|-------------|
| `BaseEntity` | Existe | OK |
| `RecordNotFoundException` | Existe | Só tem construtor com UUID, falta `(String entity, Object id)` |
| `BusinessException` | **Não existe** | Necessária para regras de negócio (409 Conflict) |
| `ApplicationControllerAdvice` | Existe | Retorna `String` simples, não `ProblemDetail` (RFC 7807) |
| `ValueOfEnum` / `ValueOfEnumValidator` | Existem | OK |
| JwtFilter / SecurityConfig | **Não existe** | Necessário para autenticação |
| Scripts SQL | **Não existe** | Necessário para criação das tabelas |
| Testes unitários/integração | **Não existe** | Apenas `ReviewItApplicationTests` padrão |

---

## Lista de Tarefas para Finalizar o Projeto

### 1. Correções na Infraestrutura Existente

- [ ] **Criar `BusinessException`** em `com.pedrorohloff.exception` (retorna 409 Conflict)
- [ ] **Adicionar construtor `(String entity, Object id)`** em `RecordNotFoundException`
- [ ] **Refatorar `ApplicationControllerAdvice`** para retornar `ProblemDetail` (RFC 7807) em vez de `String`
- [ ] **Adicionar `FieldValidationError`** record dentro do Advice para erros de validação

### 2. Domínio Comment (Correções)

- [ ] **Fazer `Comment` estender `BaseEntity`** (em vez de ter id/createdAt próprios)
- [ ] **Substituir `@Data` por `@Getter @Setter @NoArgsConstructor`** na entidade `Comment`
- [ ] **Adicionar validações Bean Validation** em `Comment` (`@NotNull`, `@NotBlank`, `@Length`)
- [ ] **Criar `CommentRequestDTO`** (record com `content` validado)
- [ ] **Criar `CommentPageDTO`** (record paginado)
- [ ] **Atualizar `CommentMapper`** para injetar `ProfileMapper` e usar `toDTO(Comment, Profile, long likeCount)`
- [ ] **Atualizar `CommentController`** para usar `CommentRequestDTO` e retornar `CommentPageDTO`
- [ ] **Atualizar `CommentService`** para paginação e autenticação

### 3. Domínio Post (Correções)

- [ ] **Adicionar paginação** (`PostPageDTO` já existe, mas não é usado)
- [ ] **Adicionar autenticação** via `@RequestAttribute("currentUserId")`
- [ ] **Criar endpoint `PATCH /api/v1/posts/{id}/notification-settings`** usando `UpdateNotificationSettingsRequestDTO`
- [ ] **Adicionar verificação de autor** no update/delete
- [ ] **Adicionar verificação de suspensão/banimento** no create/update

### 4. Domínio Profile (Correções)

- [ ] **Adicionar paginação** (`ProfilePageDTO` já existe, mas não é usado)
- [ ] **Adicionar autenticação** via `@RequestAttribute("currentUserId")`
- [ ] **Adicionar verificação de autor** no update/delete

### 5. Domínio Like (Criação Completa)

- [ ] **Criar entidade `PostLike`** (com `@UniqueConstraint` em post_id + user_id)
- [ ] **Criar entidade `CommentLike`** (com `@UniqueConstraint` em comment_id + user_id)
- [ ] **Criar repositórios** `PostLikeRepository` e `CommentLikeRepository`
- [ ] **Criar `ToggleLikeDTO`** (record com `liked` e `likeCount`)
- [ ] **Criar `LikeController`** com endpoints de toggle para posts e comentários
- [ ] **Criar `LikeService`** com lógica de toggle e contagem

### 6. Domínio Moderation (Criação Completa)

- [ ] **Criar enums** `ReportStatus` e `ActionType` com converters
- [ ] **Criar entidades** `Report` e `ModerationAction`
- [ ] **Criar repositórios** `ReportRepository` e `ModerationActionRepository`
- [ ] **Criar DTOs**: `ReportDTO`, `ReportRequestDTO`, `ReportPageDTO`, `ModerationActionDTO`, `ApplyActionRequestDTO`
- [ ] **Criar mappers**: `ReportMapper` e `ModerationActionMapper`
- [ ] **Criar `ModerationController`** com endpoints para reports e ações
- [ ] **Criar `ModerationService`** com lógica de moderação

### 7. Domínio Notification (Criação Completa)

- [ ] **Criar enums** `NotificationType` e `DeliveryChannel` com converters
- [ ] **Criar entidade** `Notification`
- [ ] **Criar repositório** `NotificationRepository`
- [ ] **Criar DTOs**: `NotificationDTO`, `NotificationPageDTO`, `MarkAsReadRequestDTO`
- [ ] **Criar mapper** `NotificationMapper`
- [ ] **Criar `NotificationController`** com endpoints de listagem e marcação como lida
- [ ] **Criar `NotificationService`** com lógica de notificações

### 8. Segurança e Autenticação

- [ ] **Criar `JwtFilter`** (filtro de autenticação JWT)
- [ ] **Criar `SecurityConfig`** (configuração do Spring Security)
- [ ] **Configurar validação de JWT** com JWKS do Supabase
- [ ] **Extrair `currentUserId`** do token e disponibilizar como `@RequestAttribute`

### 9. Banco de Dados

- [ ] **Criar scripts SQL** de criação das tabelas (profiles, posts, comments, post_likes, comment_likes, reports, moderation_actions, notifications)
- [ ] **Adicionar constraints**: `uk_post_user`, `uk_comment_user`, check constraint em reports
- [ ] **Configurar `application.properties`** para PostgreSQL em produção

### 10. Testes

- [ ] **Criar testes unitários** para Services
- [ ] **Criar testes de integração** para Controllers
- [ ] **Criar testes de validação** para DTOs

### 11. Documentação e Finalização

- [ ] **Criar README.md** com instruções de setup
- [ ] **Criar documentação da API** (OpenAPI/Swagger)
- [ ] **Configurar CI/CD** (se aplicável)

---

## Ordem Recomendada de Execução

1. **Infraestrutura** (BusinessException, ApplicationControllerAdvice, RecordNotFoundException)
2. **Segurança** (JwtFilter, SecurityConfig)
3. **Correções** nos domínios existentes (Comment, Post, Profile)
4. **Like** (criação completa)
5. **Moderation** (criação completa)
6. **Notification** (criação completa)
7. **Banco de dados** (scripts SQL)
8. **Testes**
9. **Documentação**

---

## Observações Importantes

- O package base do projeto é `com.pedrorohloff` (não `com.seuprojeto.reviewit` como nos documentos, que é um placeholder)
- A pasta `misc/` está corretamente ignorada pelo `.gitignore` (linha 6)
- O projeto usa Spring Boot 4.1.1 com Java 25
- O banco de dados atual é H2 em memória (para desenvolvimento)
- A especificação prevê PostgreSQL via Supabase em produção
