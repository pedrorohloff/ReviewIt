# Diagramas — ReviewIt (Padrão crud-angular-spring)

> Diagramas atualizados em sintaxe [Mermaid](https://mermaid.js.org), alinhados rigorosamente com a modelagem do documento `entidades-dtos-reviewit-updated.md` e o padrão arquitetural de referência do **`crud-angular-spring`** (Loiane Groner).
> Inclui enums em inglês com valores amigáveis via `getValue()`, Mappers `@Component`, DTOs records, tratamento de erro RFC 7807 (`ProblemDetail`) e convenções do ecossistema Spring Boot 3+.

---

## 1. Diagrama de Entidade-Relacionamento (DER)

Modela as tabelas do backend no PostgreSQL (via Supabase). O vínculo com o serviço de autenticação (`auth.users`) é feito na tabela `profiles` através do mesmo UUID. Os valores enumerados refletem as strings salvas no banco pelos respectivos `AttributeConverter`.

```mermaid
erDiagram
    PROFILES ||--o{ POSTS : escreve
    PROFILES ||--o{ COMMENTS : escreve
    PROFILES ||--o{ POST_LIKES : curte
    PROFILES ||--o{ COMMENT_LIKES : curte
    PROFILES ||--o{ REPORTS : denuncia
    PROFILES ||--o{ MODERATION_ACTIONS : "aplica (moderador)"
    PROFILES ||--o{ MODERATION_ACTIONS : "sofre (alvo)"
    PROFILES ||--o{ NOTIFICATIONS : recebe

    POSTS ||--o{ COMMENTS : recebe
    POSTS ||--o{ POST_LIKES : recebe
    POSTS ||--o{ REPORTS : "pode ser alvo de"
    POSTS ||--o{ NOTIFICATIONS : origina

    COMMENTS ||--o{ COMMENT_LIKES : recebe
    COMMENTS ||--o{ REPORTS : "pode ser alvo de"

    REPORTS ||--o| MODERATION_ACTIONS : gera

    PROFILES {
        uuid id PK "mesmo UUID de auth.users"
        string username "UNIQUE, length: 50"
        string avatar_url "length: 500"
        string role "Regular | Moderator | Admin"
        string status "Active | Suspended | Banned"
        timestamp suspended_until "nulo se não suspenso"
        timestamp created_at
    }

    POSTS {
        uuid id PK
        uuid author_id FK
        string title "length: 200"
        string content_type "Book | Movie | Album | Series | Game"
        string genre "Action | Romance | Horror | Comedy | Drama"
        text content "length: 5000"
        boolean notify_enabled
        string notify_channel "None | In-App | Email | Both"
        timestamp created_at
        timestamp updated_at
    }

    COMMENTS {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        text content "length: 2000"
        timestamp created_at
        timestamp updated_at
    }

    POST_LIKES {
        uuid id PK
        uuid post_id FK "UNIQUE(post_id, user_id)"
        uuid user_id FK "UNIQUE(post_id, user_id)"
        timestamp created_at
    }

    COMMENT_LIKES {
        uuid id PK
        uuid comment_id FK "UNIQUE(comment_id, user_id)"
        uuid user_id FK "UNIQUE(comment_id, user_id)"
        timestamp created_at
    }

    REPORTS {
        uuid id PK
        uuid reporter_id FK
        uuid post_id FK "nulo se o alvo for comentário"
        uuid comment_id FK "nulo se o alvo for post"
        string reason "length: 500"
        string status "Pending | Resolved"
        timestamp created_at
    }

    MODERATION_ACTIONS {
        uuid id PK
        uuid report_id FK
        uuid moderator_id FK
        uuid target_user_id FK
        string action_type "Remove | Warn | Suspend | Ban"
        int duration_days "obrigatório apenas para Suspend"
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        string type "Like Milestone | New Comment"
        string channel "In-App | Email"
        timestamp created_at
        timestamp read_at "nulo se ainda não lida"
    }
```

### Regras e Constraints de Banco:
- **`uk_post_user` e `uk_comment_user`**: Constraints `UNIQUE(post_id, user_id)` e `UNIQUE(comment_id, user_id)` impedem curtidas duplicadas diretamente na camada de persistência (RF17).
- **Check Constraint em `REPORTS`**: `CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))`, garantindo que uma denúncia aponte para um post OU um comentário, nunca ambos ou nenhum.
- **Portabilidade**: Colunas de texto utilizam `@Column(length = ...)` para compatibilidade transparente entre H2 em desenvolvimento/testes e PostgreSQL em produção.

---

## 2. Diagrama de Arquitetura de Componentes

Visão detalhada da arquitetura baseada no padrão `crud-angular-spring`:

```mermaid
flowchart TD
    subgraph Frontend["Frontend SPA (React)"]
        UI["UI / Componentes"]
        APIClient["HTTP Client (Fetch / Axios)"]
        UI --> APIClient
    end

    subgraph SupabaseServices["Supabase BaaS"]
        SupabaseAuth["Supabase Auth (OAuth / JWT)"]
        SupabaseDB[("PostgreSQL")]
        SupabaseRealtime["Realtime Engine"]
    end

    subgraph SpringBootBackend["Backend Spring Boot API (Padrão Loiane)"]
        subgraph SecurityLayer["Filtro de Segurança"]
            JwtFilter["JWT Bearer Authentication Filter"]
        end

        subgraph PresentationLayer["Camada de Apresentação"]
            Controller["@RestController (@Validated)"]
            Advice["ApplicationControllerAdvice (@RestControllerAdvice)"]
            ProblemDetails["RFC 7807 ProblemDetail Responses"]
            Advice -. "gera" .-> ProblemDetails
        end

        subgraph ValidationAndDTO["DTOs & Validações"]
            RequestDTO["*RequestDTO (Records + @Valid + @ValueOfEnum)"]
            ResponseDTO["*DTO / *PageDTO (Records)"]
            EnumValidator["ValueOfEnumValidator"]
            RequestDTO -. "valida via" .-> EnumValidator
        end

        subgraph MappingLayer["Camada de Mapeamento"]
            Mapper["*Mapper (@Component Spring)"]
        end

        subgraph ServiceLayer["Camada de Negócio"]
            Service["*Service (@Validated, @Transactional)"]
            Exceptions["BusinessException & RecordNotFoundException"]
            Service -. "dispara" .-> Exceptions
        end

        subgraph DataLayer["Camada de Persistência"]
            Repository["*Repository (Spring Data JPA)"]
            Entity["@Entity (BaseEntity)"]
            Converters["*Converter (AttributeConverter)"]
            Entity -. "converte com" .-> Converters
        end
    end

    %% Fluxos de Autenticação e Realtime
    UI -- "1. Login OAuth" --> SupabaseAuth
    UI -- "Subscrição WebSockets" --> SupabaseRealtime
    SupabaseRealtime -. "Eventos de Mudança (CDC)" .-> SupabaseDB

    %% Fluxos HTTP
    APIClient -- "2. Requisição REST (Bearer Token + JSON)" --> JwtFilter
    JwtFilter -- "3. Valida Assinatura JWT (JWKS)" --> SupabaseAuth
    JwtFilter --> Controller

    %% Fluxos Internos do Backend
    Controller -- "Recebe e Valida" --> RequestDTO
    Controller --> Service
    Exceptions -. "capturado por" .-> Advice
    Advice -- "Retorna Erro Estruturado (400, 404, 409)" --> APIClient

    Service --> Mapper
    Mapper -- "DTO -> Entity" --> Entity
    Mapper -- "Entity -> DTO" --> ResponseDTO
    Service --> Repository
    Repository --> Entity
    Repository -- "SQL (JPA / Hibernate)" --> SupabaseDB
    Controller -- "Retorna 200/201/204" --> APIClient
```

---

## 3. Diagrama de Sequência — Autenticação OAuth

Mostra a interação inicial entre o usuário, frontend e o Supabase Auth antes de qualquer chamada autenticada ao backend.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as React (Frontend)
    participant S as Supabase Auth
    participant P as Provedor OAuth (Google / GitHub)

    U->>F: Clica em "Entrar com Google / GitHub"
    F->>S: signInWithOAuth(provider)
    S->>P: Redireciona para página de consentimento
    P-->>U: Exibe permissões solicitadas
    U->>P: Autoriza acesso
    P-->>S: Redireciona com código de autorização
    S-->>F: Retorna sessão (access_token JWT + refresh_token)
    F->>F: Armazena token em memória / local seguro
    Note over F: Token pronto para autenticar requisições REST
```

---

## 4. Diagrama de Sequência — Criar Post (Fluxo com Validação e RFC 7807)

Mostra a requisição autenticada, validação em múltiplas etapas, tratamento de erros via `ApplicationControllerAdvice` e retorno padronizado no molde do `crud-angular-spring`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as React (Frontend)
    participant A as Spring Security (JwtFilter)
    participant C as PostController (@Validated)
    participant V as ValueOfEnumValidator
    participant S as PostService (@Transactional)
    participant M as PostMapper (@Component)
    participant H as ApplicationControllerAdvice
    participant R as PostRepository
    participant D as PostgreSQL

    U->>F: Preenche título, tipo, gênero e resenha
    F->>A: POST /api/posts (Headers: Bearer JWT, Body: PostRequestDTO)
    A->>A: Valida assinatura do JWT e extrai currentUserId

    alt Token ausente ou inválido
        A-->>F: 401 Unauthorized
    else Token Válido
        A->>C: Invoca create(currentUserId, dto)
        C->>V: Valida Bean Validation + @ValueOfEnum nos campos
        
        alt Dados Inválidos (ex: gênero inválido ou título em branco)
            V-->>C: Dispara MethodArgumentNotValidException
            C->>H: Captura exceção no advice
            H-->>F: 400 Bad Request (RFC 7807 ProblemDetail com lista "errors")
            F-->>U: Exibe erros no formulário
        else Dados Válidos
            C->>S: create(authorId, dto)
            S->>S: Checa autor e regras de suspensão
            
            alt Usuário com conta Suspensa / Banida
                S->>H: Lança BusinessException("Conta suspensa para escrita")
                H-->>F: 409 Conflict (ProblemDetail)
            else Usuário Ativo
                S->>M: toModel(dto, authorId)
                M-->>S: Instância de Post
                S->>R: save(post)
                R->>D: INSERT INTO posts (...) VALUES (...)
                D-->>R: Registro persistido com ID gerado
                R-->>S: Entidade Post salva
                S->>M: toDTO(savedPost, authorProfile, 0, 0)
                M-->>S: PostDTO (Record com autor embutido)
                S-->>C: PostDTO
                C-->>F: 201 Created (PostDTO)
                F-->>U: Resenha exibida com sucesso
            end
        end
    end
```

---

## 5. Diagramas de Estados

### 5.1 Ciclo de Vida da Denúncia (`ReportStatus`)

```mermaid
stateDiagram-v2
    [*] --> Pending : Denúncia criada pelo usuário

    Pending --> Resolved : Moderador aplica Remove
    Pending --> Resolved : Moderador aplica Warn
    Pending --> Resolved : Moderador aplica Suspend
    Pending --> Resolved : Moderador aplica Ban
    Pending --> Resolved : Moderador arquiva sem ação

    Resolved --> [*]
```

### 5.2 Ciclo de Vida da Conta do Usuário (`AccountStatus`)

```mermaid
stateDiagram-v2
    [*] --> Active : Cadastro realizado via OAuth

    Active --> Suspended : Moderador aplica ação Suspend (com durationDays)
    Suspended --> Active : Prazo de suspended_until expira automaticamente
    Suspended --> Banned : Moderador aplica ação Ban permanente
    Active --> Banned : Moderador aplica ação Ban permanente

    Banned --> [*] : Sem processo de recurso no MVP
```

---

## 6. Diagrama de Classes: Arquitetura em Camadas (Domínio Post)

Detalha as classes, anotações, injeções de dependência e responsabilidades no padrão exato do `crud-angular-spring`.

```mermaid
classDiagram
    direction TB

    class PostController {
        -PostService postService
        +PostController(PostService)
        +findAll(int page, int pageSize) PostPageDTO
        +findById(UUID id) PostDTO
        +create(UUID authorId, PostRequestDTO dto) PostDTO
        +update(UUID id, UUID requesterId, PostRequestDTO dto) PostDTO
        +delete(UUID id, UUID requesterId) void
    }

    class PostService {
        -PostRepository postRepository
        -ProfileRepository profileRepository
        -PostMapper postMapper
        +PostService(PostRepository, ProfileRepository, PostMapper)
        +findAll(int page, int pageSize) PostPageDTO
        +findById(UUID id) PostDTO
        +create(UUID authorId, PostRequestDTO dto) PostDTO
        +update(UUID id, UUID requesterId, PostRequestDTO dto) PostDTO
        +delete(UUID id, UUID requesterId) void
    }

    class PostRepository {
        <<interface>>
        +findAll(Pageable) Page~Post~
        +findById(UUID) Optional~Post~
        +findByAuthorId(UUID) List~Post~
    }

    class PostMapper {
        -ProfileMapper profileMapper
        +PostMapper(ProfileMapper)
        +toModel(PostRequestDTO, UUID authorId) Post
        +toDTO(Post, Profile author, long likes, long comments) PostDTO
        +convertContentType(String) ContentType
        +convertGenre(String) Genre
        +convertNotifyChannel(String) NotifyChannel
    }

    class PostRequestDTO {
        <<record>>
        +String title
        +String contentType
        +String genre
        +String content
    }

    class PostDTO {
        <<record>>
        +UUID id
        +ProfileSummaryDTO author
        +String title
        +String contentType
        +String genre
        +String content
        +boolean notifyEnabled
        +String notifyChannel
        +long likeCount
        +long commentCount
        +Instant createdAt
        +Instant updatedAt
    }

    class PostPageDTO {
        <<record>>
        +List~PostDTO~ posts
        +long totalElements
        +int totalPages
    }

    class Post {
        -UUID id
        -UUID authorId
        -String title
        -ContentType contentType
        -Genre genre
        -String content
        -boolean notifyEnabled
        -NotifyChannel notifyChannel
        -Instant createdAt
        -Instant updatedAt
    }

    class ApplicationControllerAdvice {
        +handleNotFoundException(RecordNotFoundException) ProblemDetail
        +handleBusinessException(BusinessException) ProblemDetail
        +handleDataIntegrityViolationException(DataIntegrityViolationException) ProblemDetail
        +validationError(MethodArgumentNotValidException) ProblemDetail
        +handleConstraintViolationException(ConstraintViolationException) ProblemDetail
    }

    class RecordNotFoundException {
        +RecordNotFoundException(String message)
        +RecordNotFoundException(String entity, Object id)
    }

    class BusinessException {
        +BusinessException(String message)
    }

    PostController --> PostService : delega operações
    PostController ..> PostRequestDTO : recebe no body
    PostController ..> PostDTO : responde
    PostController ..> PostPageDTO : responde
    PostService --> PostRepository : persiste dados
    PostService --> PostMapper : converte objetos
    PostService ..> RecordNotFoundException : dispara quando não acha
    PostService ..> BusinessException : dispara em conflito
    PostMapper --> Post : instancia e popula
    PostMapper ..> PostDTO : cria
    PostRepository --> Post : gerencia
    ApplicationControllerAdvice ..> RecordNotFoundException : intercepta
    ApplicationControllerAdvice ..> BusinessException : intercepta
```

---

## 7. Diagrama de Classes: Entidades JPA e Enums com Converters

Ilustra as entidades Java, o modelo de herança com `BaseEntity`, os tipos de Enum com seus métodos e o padrão de `AttributeConverter`.

```mermaid
classDiagram
    direction TB

    class BaseEntity {
        <<MappedSuperclass>>
        #UUID id
        #Instant createdAt
        +getId() UUID
        +getCreatedAt() Instant
    }

    class Profile {
        -UUID id
        -String username
        -String avatarUrl
        -Role role
        -AccountStatus status
        -Instant suspendedUntil
        -Instant createdAt
    }

    class Post {
        -UUID authorId
        -String title
        -ContentType contentType
        -Genre genre
        -String content
        -boolean notifyEnabled
        -NotifyChannel notifyChannel
        -Instant updatedAt
    }

    class Comment {
        -UUID postId
        -UUID authorId
        -String content
        -Instant updatedAt
    }

    class PostLike {
        -UUID postId
        -UUID userId
    }

    class CommentLike {
        -UUID commentId
        -UUID userId
    }

    class Report {
        -UUID reporterId
        -UUID postId
        -UUID commentId
        -String reason
        -ReportStatus status
    }

    class ModerationAction {
        -UUID reportId
        -UUID moderatorId
        -UUID targetUserId
        -ActionType actionType
        -Integer durationDays
    }

    class Notification {
        -UUID userId
        -UUID postId
        -NotificationType type
        -DeliveryChannel channel
        -Instant readAt
    }

    %% Enums
    class Role {
        <<enumeration>>
        REGULAR("Regular")
        MODERATOR("Moderator")
        ADMIN("Admin")
        -String value
        +getValue() String
        +fromValue(String)$ Role
        +toString() String
    }

    class AccountStatus {
        <<enumeration>>
        ACTIVE("Active")
        SUSPENDED("Suspended")
        BANNED("Banned")
        -String value
        +getValue() String
        +fromValue(String)$ AccountStatus
        +toString() String
    }

    class ContentType {
        <<enumeration>>
        BOOK("Book")
        MOVIE("Movie")
        ALBUM("Album")
        SERIES("Series")
        GAME("Game")
        -String value
        +getValue() String
        +fromValue(String)$ ContentType
        +toString() String
    }

    class Genre {
        <<enumeration>>
        ACTION("Action")
        ROMANCE("Romance")
        HORROR("Horror")
        COMEDY("Comedy")
        DRAMA("Drama")
        -String value
        +getValue() String
        +fromValue(String)$ Genre
        +toString() String
    }

    class NotifyChannel {
        <<enumeration>>
        NONE("None")
        IN_APP("In-App")
        EMAIL("Email")
        BOTH("Both")
        -String value
        +getValue() String
        +fromValue(String)$ NotifyChannel
        +toString() String
    }

    class ReportStatus {
        <<enumeration>>
        PENDING("Pending")
        RESOLVED("Resolved")
        -String value
        +getValue() String
        +fromValue(String)$ ReportStatus
        +toString() String
    }

    class ActionType {
        <<enumeration>>
        REMOVE("Remove")
        WARN("Warn")
        SUSPEND("Suspend")
        BAN("Ban")
        -String value
        +getValue() String
        +fromValue(String)$ ActionType
        +toString() String
    }

    class NotificationType {
        <<enumeration>>
        LIKE_MILESTONE("Like Milestone")
        NEW_COMMENT("New Comment")
        -String value
        +getValue() String
        +fromValue(String)$ NotificationType
        +toString() String
    }

    class DeliveryChannel {
        <<enumeration>>
        IN_APP("In-App")
        EMAIL("Email")
        -String value
        +getValue() String
        +fromValue(String)$ DeliveryChannel
        +toString() String
    }

    %% Converters
    class RoleConverter {
        <<Converter>>
        +convertToDatabaseColumn(Role) String
        +convertToEntityAttribute(String) Role
    }

    class AccountStatusConverter {
        <<Converter>>
        +convertToDatabaseColumn(AccountStatus) String
        +convertToEntityAttribute(String) AccountStatus
    }

    class ContentTypeConverter {
        <<Converter>>
        +convertToDatabaseColumn(ContentType) String
        +convertToEntityAttribute(String) ContentType
    }

    class GenreConverter {
        <<Converter>>
        +convertToDatabaseColumn(Genre) String
        +convertToEntityAttribute(String) Genre
    }

    class NotifyChannelConverter {
        <<Converter>>
        +convertToDatabaseColumn(NotifyChannel) String
        +convertToEntityAttribute(String) NotifyChannel
    }

    class ReportStatusConverter {
        <<Converter>>
        +convertToDatabaseColumn(ReportStatus) String
        +convertToEntityAttribute(String) ReportStatus
    }

    class ActionTypeConverter {
        <<Converter>>
        +convertToDatabaseColumn(ActionType) String
        +convertToEntityAttribute(String) ActionType
    }

    class NotificationTypeConverter {
        <<Converter>>
        +convertToDatabaseColumn(NotificationType) String
        +convertToEntityAttribute(String) NotificationType
    }

    class DeliveryChannelConverter {
        <<Converter>>
        +convertToDatabaseColumn(DeliveryChannel) String
        +convertToEntityAttribute(String) DeliveryChannel
    }

    %% Relações de Herança
    BaseEntity <|-- Post
    BaseEntity <|-- Comment
    BaseEntity <|-- PostLike
    BaseEntity <|-- CommentLike
    BaseEntity <|-- Report
    BaseEntity <|-- ModerationAction
    BaseEntity <|-- Notification

    %% Vínculos Lógicos por ID
    Post ..> Profile : authorId
    Comment ..> Profile : authorId
    Comment ..> Post : postId
    PostLike ..> Post : postId
    PostLike ..> Profile : userId
    CommentLike ..> Comment : commentId
    CommentLike ..> Profile : userId
    Report ..> Profile : reporterId
    Report ..> Post : postId (opcional)
    Report ..> Comment : commentId (opcional)
    ModerationAction ..> Report : reportId
    ModerationAction ..> Profile : moderatorId, targetUserId
    Notification ..> Profile : userId
    Notification ..> Post : postId

    %% Uso dos Enums nas Entidades
    Profile --> Role
    Profile --> AccountStatus
    Post --> ContentType
    Post --> Genre
    Post --> NotifyChannel
    Report --> ReportStatus
    ModerationAction --> ActionType
    Notification --> NotificationType
    Notification --> DeliveryChannel

    %% Conexão com os Converters
    RoleConverter ..> Role : converte
    AccountStatusConverter ..> AccountStatus : converte
    ContentTypeConverter ..> ContentType : converte
    GenreConverter ..> Genre : converte
    NotifyChannelConverter ..> NotifyChannel : converte
    ReportStatusConverter ..> ReportStatus : converte
    ActionTypeConverter ..> ActionType : converte
    NotificationTypeConverter ..> NotificationType : converte
    DeliveryChannelConverter ..> DeliveryChannel : converte
```
