# Entidades, DTOs e Estrutura de Pastas — ReviewIt (Padrão crud-angular-spring)

> Especificação arquitetural reestruturada rigorosamente com base no projeto de referência **`crud-angular-spring`** (arquitetura de Loiane Groner).
> Integração das convenções de **Enums com Converters dedicados**, **Tratamento de Exceções via RFC 7807 (`ProblemDetail`)**, **Validações com Bean Validation e `@ValueOfEnum` customizado**, e **DTOs em Java Records com Mappers manuais como `@Component`**.

---

## 1. Estrutura de Pastas Completa

A organização segue a divisão por domínio funcional (feature-packaging), mantendo pacotes transversais (`exception` e `shared`) desacoplados e cada domínio isolado com suas entidades, controladores, serviços, repositórios, DTOs, mappers, enums e converters.

```
src/main/java/com/seuprojeto/reviewit/
│
├── ReviewItApplication.java
│
├── exception/
│   ├── RecordNotFoundException.java          # Exceção para recursos não encontrados (404)
│   └── BusinessException.java                # Exceção para conflitos e regras de negócio (409)
│
├── shared/
│   ├── BaseEntity.java                       # @MappedSuperclass (id UUID, createdAt)
│   ├── controller/
│   │   └── ApplicationControllerAdvice.java  # @RestControllerAdvice com RFC 7807 ProblemDetail
│   └── validation/
│       ├── ValueOfEnum.java                  # Anotação customizada de validação de Enums
│       └── ValueOfEnumValidator.java         # Validador compatível com CharSequence e Enum::toString
│
├── profile/
│   ├── Profile.java
│   ├── ProfileController.java
│   ├── ProfileService.java
│   ├── ProfileRepository.java
│   ├── dto/
│   │   ├── ProfileDTO.java                   # Resposta detalhada do perfil
│   │   ├── ProfileSummaryDTO.java            # Resumo (autor/moderador em outros domínios)
│   │   ├── ProfileRequestDTO.java            # Requisição de atualização de perfil
│   │   ├── ProfilePageDTO.java               # Resposta paginada
│   │   └── mapper/
│   │       └── ProfileMapper.java            # @Component Spring para mapeamento manual
│   └── enums/
│       ├── Role.java                         # REGULAR, MODERATOR, ADMIN
│       ├── AccountStatus.java                # ACTIVE, SUSPENDED, BANNED
│       └── converters/
│           ├── RoleConverter.java            # AttributeConverter<Role, String>
│           └── AccountStatusConverter.java   # AttributeConverter<AccountStatus, String>
│
├── post/
│   ├── Post.java
│   ├── PostController.java
│   ├── PostService.java
│   ├── PostRepository.java
│   ├── dto/
│   │   ├── PostDTO.java                      # Resposta completa do post com contadores
│   │   ├── PostRequestDTO.java               # Criação e atualização de post
│   │   ├── PostPageDTO.java                  # Resposta paginada de posts
│   │   ├── UpdateNotificationSettingsRequestDTO.java
│   │   └── mapper/
│   │       └── PostMapper.java               # @Component injetando ProfileMapper
│   └── enums/
│       ├── ContentType.java                  # BOOK, MOVIE, ALBUM, SERIES, GAME
│       ├── Genre.java                        # ACTION, ROMANCE, HORROR, COMEDY, DRAMA
│       ├── NotifyChannel.java                # NONE, IN_APP, EMAIL, BOTH
│       └── converters/
│           ├── ContentTypeConverter.java
│           ├── GenreConverter.java
│           └── NotifyChannelConverter.java
│
├── comment/
│   ├── Comment.java
│   ├── CommentController.java
│   ├── CommentService.java
│   ├── CommentRepository.java
│   ├── dto/
│   │   ├── CommentDTO.java
│   │   ├── CommentRequestDTO.java
│   │   ├── CommentPageDTO.java
│   │   └── mapper/
│   │       └── CommentMapper.java            # @Component injetando ProfileMapper
│
├── like/
│   ├── PostLike.java
│   ├── CommentLike.java
│   ├── LikeController.java
│   ├── LikeService.java
│   ├── PostLikeRepository.java
│   ├── CommentLikeRepository.java
│   └── dto/
│       └── ToggleLikeDTO.java                # Resposta do toggle (liked, likeCount)
│
├── moderation/
│   ├── Report.java
│   ├── ModerationAction.java
│   ├── ModerationController.java
│   ├── ModerationService.java
│   ├── ReportRepository.java
│   ├── ModerationActionRepository.java
│   ├── dto/
│   │   ├── ReportDTO.java
│   │   ├── ReportRequestDTO.java
│   │   ├── ReportPageDTO.java
│   │   ├── ModerationActionDTO.java
│   │   ├── ApplyActionRequestDTO.java
│   │   └── mapper/
│   │       ├── ReportMapper.java             # @Component injetando ProfileMapper
│   │       └── ModerationActionMapper.java   # @Component injetando ProfileMapper
│   └── enums/
│       ├── ReportStatus.java                 # PENDING, RESOLVED
│       ├── ActionType.java                   # REMOVE, WARN, SUSPEND, BAN
│       └── converters/
│           ├── ReportStatusConverter.java
│           └── ActionTypeConverter.java
│
└── notification/
    ├── Notification.java
    ├── NotificationController.java
    ├── NotificationService.java
    ├── NotificationRepository.java
    ├── dto/
    │   ├── NotificationDTO.java
    │   ├── NotificationPageDTO.java
    │   ├── MarkAsReadRequestDTO.java
    │   └── mapper/
    │       └── NotificationMapper.java       # @Component
    └── enums/
        ├── NotificationType.java             # LIKE_MILESTONE, NEW_COMMENT
        ├── DeliveryChannel.java              # IN_APP, EMAIL
        └── converters/
            ├── NotificationTypeConverter.java
            └── DeliveryChannelConverter.java
```

---

## 2. Princípios de Implementação (Padrão crud-angular-spring)

### 2.1 Enums e Converters
No padrão do `crud-angular-spring`:
1. Cada Enum possui um atributo `private final String value`, construtor privado, método `getValue()`, método estático `fromValue(String value)` e o sobrescrito `toString()` retornando `value`.
2. O método `toString()` é crucial pois o validador customizado `@ValueOfEnum` extrai os valores aceitos via `Stream.of(annotation.enumClass().getEnumConstants()).map(Enum::toString)`.
3. Os converters implementam `AttributeConverter<E, String>` com `@Converter(autoApply = true)`. No banco, grava-se `attribute.getValue()`, desacoplando os identificadores internos em Java da representação persistida.

### 2.2 Tratamento Global de Exceções com RFC 7807 (`ProblemDetail`)
Em vez de encapsular erros em registros manuais (`ApiError`), o projeto adota a especificação padrão do Spring Boot 3+ (**RFC 7807 Problem Details**):
1. **`RecordNotFoundException`** dispara HTTP `404 Not Found` com mensagem descritiva.
2. **`BusinessException`** e **`DataIntegrityViolationException`** disparam HTTP `409 Conflict`.
3. **`MethodArgumentNotValidException`** e **`ConstraintViolationException`** disparam HTTP `400 Bad Request` com o título `"Validation failed"` e a propriedade customizada `"errors"` contendo uma lista de registros `FieldValidationError(field, message)`.

### 2.3 Validações em Camadas
1. **Controller & Service**: Anotados com `@Validated` no nível de classe. Métodos que recebem payload JSON validam com `@Valid @RequestBody`. Parâmetros de rota (`@PathVariable`) e busca (`@RequestParam`) usam `@NotNull`, `@NotBlank`, etc.
2. **DTOs de Entrada (`*RequestDTO`)**: Anotados com Bean Validation (`@NotNull`, `@NotBlank`, `@Length(min = ..., max = ...)` ou `@Size`) e anotação customizada `@ValueOfEnum(enumClass = ...)` para campos de Enum recebidos como String.
3. **Entidades**: Protegidas por constraints de banco (`@Column(nullable = false, length = ...)`) e anotações Bean Validation.

### 2.4 DTOs e Mappers
1. **Java Records**: Todos os DTOs (`*DTO`, `*RequestDTO`, `*PageDTO`) são `record`, garantindo imutabilidade e concisão.
2. **Mappers como `@Component` Spring**: Não se utiliza MapStruct ou ModelMapper diretamente sobre os records para evitar problemas de compatibilidade e falta de transparência em regras complexas. Cada mapper é uma classe com anotação `@Component`, injetável via construtor, com métodos explícitos `toDTO`, `toModel` e funções auxiliares de conversão.

---

## 3. Infraestrutura Compartilhada (`shared/` e `exception/`)

### 3.1 Exceções de Domínio (`exception/`)

```java
// exception/RecordNotFoundException.java
package com.seuprojeto.reviewit.exception;

public class RecordNotFoundException extends RuntimeException {

    public RecordNotFoundException(String message) {
        super(message);
    }

    public RecordNotFoundException(String entityName, Object id) {
        super(entityName + " not found with id: " + id);
    }
}
```

```java
// exception/BusinessException.java
package com.seuprojeto.reviewit.exception;

public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
```

### 3.2 Base Entity (`shared/BaseEntity.java`)

```java
// shared/BaseEntity.java
package com.seuprojeto.reviewit.shared;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue
    protected UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    protected Instant createdAt = Instant.now();
}
```

### 3.3 Tratador Global de Erros (`shared/controller/ApplicationControllerAdvice.java`)

```java
// shared/controller/ApplicationControllerAdvice.java
package com.seuprojeto.reviewit.shared.controller;

import com.seuprojeto.reviewit.exception.BusinessException;
import com.seuprojeto.reviewit.exception.RecordNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@RestControllerAdvice
public class ApplicationControllerAdvice {

    private static final String VALIDATION_FAILED = "Validation failed";

    @ExceptionHandler(RecordNotFoundException.class)
    public ProblemDetail handleNotFoundException(RecordNotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleBusinessException(BusinessException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolationException(DataIntegrityViolationException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "The operation conflicts with existing data");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validationError(MethodArgumentNotValidException ex) {
        BindingResult result = ex.getBindingResult();
        final List<FieldError> fieldErrors = result.getFieldErrors();

        List<FieldValidationError> errors = fieldErrors.stream()
                .map(error -> new FieldValidationError(error.getField(), error.getDefaultMessage()))
                .toList();

        return validationProblem(errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolationException(ConstraintViolationException e) {
        List<FieldValidationError> errors = e.getConstraintViolations().stream()
                .map(violation -> new FieldValidationError(
                        violation.getPropertyPath().toString(),
                        violation.getMessage()))
                .toList();

        return validationProblem(errors);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        String requiredType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "a different type";
        String message = "Failed to convert value to required type " + requiredType;
        return validationProblem(List.of(new FieldValidationError(ex.getName(), message)));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingServletRequestParameterException(MissingServletRequestParameterException ex) {
        return validationProblem(
                List.of(new FieldValidationError(ex.getParameterName(), "Required parameter is not present")));
    }

    private ProblemDetail validationProblem(List<FieldValidationError> errors) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, VALIDATION_FAILED);
        problemDetail.setProperty("errors", errors);
        return problemDetail;
    }

    public record FieldValidationError(String field, String message) {
    }
}
```

### 3.4 Validador Customizado de Enums (`shared/validation/`)

```java
// shared/validation/ValueOfEnum.java
package com.seuprojeto.reviewit.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({ METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE })
@Retention(RUNTIME)
@Documented
@Constraint(validatedBy = ValueOfEnumValidator.class)
public @interface ValueOfEnum {
    Class<? extends Enum<?>> enumClass();

    String message() default "must be any of enum {enumClass}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
```

```java
// shared/validation/ValueOfEnumValidator.java
package com.seuprojeto.reviewit.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ValueOfEnumValidator implements ConstraintValidator<ValueOfEnum, CharSequence> {

    private List<String> acceptedValues;

    @Override
    public void initialize(ValueOfEnum annotation) {
        acceptedValues = Stream.of(annotation.enumClass().getEnumConstants())
                .map(Enum::toString)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isValid(CharSequence value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return acceptedValues.contains(value.toString());
    }
}
```

---

## 4. Implementação dos Domínios

---

### 4.1 Domínio Profile (`profile/`)

`Profile` representa os dados de perfil vinculados ao `auth.users` do Supabase. Seu `id` não é gerado via sequence/identity.

#### Enums e Converters

```java
// profile/enums/Role.java
package com.seuprojeto.reviewit.profile.enums;

public enum Role {
    REGULAR("Regular"),
    MODERATOR("Moderator"),
    ADMIN("Admin");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Role fromValue(String value) {
        for (Role role : values()) {
            if (role.value.equalsIgnoreCase(value) || role.name().equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid Role: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// profile/enums/AccountStatus.java
package com.seuprojeto.reviewit.profile.enums;

public enum AccountStatus {
    ACTIVE("Active"),
    SUSPENDED("Suspended"),
    BANNED("Banned");

    private final String value;

    AccountStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static AccountStatus fromValue(String value) {
        for (AccountStatus status : values()) {
            if (status.value.equalsIgnoreCase(value) || status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid AccountStatus: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// profile/enums/converters/RoleConverter.java
package com.seuprojeto.reviewit.profile.enums.converters;

import com.seuprojeto.reviewit.profile.enums.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        if (role == null) {
            return null;
        }
        return role.getValue();
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        return Role.fromValue(value);
    }
}
```

```java
// profile/enums/converters/AccountStatusConverter.java
package com.seuprojeto.reviewit.profile.enums.converters;

import com.seuprojeto.reviewit.profile.enums.AccountStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AccountStatusConverter implements AttributeConverter<AccountStatus, String> {

    @Override
    public String convertToDatabaseColumn(AccountStatus status) {
        if (status == null) {
            return null;
        }
        return status.getValue();
    }

    @Override
    public AccountStatus convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        return AccountStatus.fromValue(value);
    }
}
```

#### Entidade

```java
// profile/Profile.java
package com.seuprojeto.reviewit.profile;

import com.seuprojeto.reviewit.profile.enums.AccountStatus;
import com.seuprojeto.reviewit.profile.enums.Role;
import com.seuprojeto.reviewit.profile.enums.converters.AccountStatusConverter;
import com.seuprojeto.reviewit.profile.enums.converters.RoleConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
public class Profile {

    @Id
    @NotNull
    private UUID id;

    @NotBlank
    @Length(min = 3, max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @NotNull
    @Column(nullable = false, length = 20)
    @Convert(converter = RoleConverter.class)
    private Role role = Role.REGULAR;

    @NotNull
    @Column(nullable = false, length = 20)
    @Convert(converter = AccountStatusConverter.class)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(name = "suspended_until")
    private Instant suspendedUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
```

#### DTOs

```java
// profile/dto/ProfileRequestDTO.java
package com.seuprojeto.reviewit.profile.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record ProfileRequestDTO(
        @NotBlank @Length(min = 3, max = 50) String username,
        @Length(max = 500) String avatarUrl
) {}
```

```java
// profile/dto/ProfileDTO.java
package com.seuprojeto.reviewit.profile.dto;

import java.time.Instant;
import java.util.UUID;

public record ProfileDTO(
        UUID id,
        String username,
        String avatarUrl,
        String role,
        String status,
        Instant suspendedUntil,
        Instant createdAt
) {}
```

```java
// profile/dto/ProfileSummaryDTO.java
package com.seuprojeto.reviewit.profile.dto;

import java.util.UUID;

public record ProfileSummaryDTO(
        UUID id,
        String username,
        String avatarUrl
) {}
```

```java
// profile/dto/ProfilePageDTO.java
package com.seuprojeto.reviewit.profile.dto;

import java.util.List;

public record ProfilePageDTO(
        List<ProfileDTO> profiles,
        long totalElements,
        int totalPages
) {}
```

#### Mapper (`@Component`)

```java
// profile/dto/mapper/ProfileMapper.java
package com.seuprojeto.reviewit.profile.dto.mapper;

import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.dto.ProfileDTO;
import com.seuprojeto.reviewit.profile.dto.ProfileRequestDTO;
import com.seuprojeto.reviewit.profile.dto.ProfileSummaryDTO;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    public ProfileDTO toDTO(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileDTO(
                profile.getId(),
                profile.getUsername(),
                profile.getAvatarUrl(),
                profile.getRole().getValue(),
                profile.getStatus().getValue(),
                profile.getSuspendedUntil(),
                profile.getCreatedAt()
        );
    }

    public ProfileSummaryDTO toSummaryDTO(Profile profile) {
        if (profile == null) {
            return null;
        }
        return new ProfileSummaryDTO(
                profile.getId(),
                profile.getUsername(),
                profile.getAvatarUrl()
        );
    }

    public Profile toModel(ProfileRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        Profile profile = new Profile();
        profile.setUsername(dto.username());
        profile.setAvatarUrl(dto.avatarUrl());
        return profile;
    }
}
```

---

### 4.2 Domínio Post (`post/`)

#### Enums e Converters

```java
// post/enums/ContentType.java
package com.seuprojeto.reviewit.post.enums;

public enum ContentType {
    BOOK("Book"),
    MOVIE("Movie"),
    ALBUM("Album"),
    SERIES("Series"),
    GAME("Game");

    private final String value;

    ContentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ContentType fromValue(String value) {
        for (ContentType ct : values()) {
            if (ct.value.equalsIgnoreCase(value) || ct.name().equalsIgnoreCase(value)) {
                return ct;
            }
        }
        throw new IllegalArgumentException("Invalid ContentType: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// post/enums/Genre.java
package com.seuprojeto.reviewit.post.enums;

public enum Genre {
    ACTION("Action"),
    ROMANCE("Romance"),
    HORROR("Horror"),
    COMEDY("Comedy"),
    DRAMA("Drama");

    private final String value;

    Genre(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static Genre fromValue(String value) {
        for (Genre g : values()) {
            if (g.value.equalsIgnoreCase(value) || g.name().equalsIgnoreCase(value)) {
                return g;
            }
        }
        throw new IllegalArgumentException("Invalid Genre: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// post/enums/NotifyChannel.java
package com.seuprojeto.reviewit.post.enums;

public enum NotifyChannel {
    NONE("None"),
    IN_APP("In-App"),
    EMAIL("Email"),
    BOTH("Both");

    private final String value;

    NotifyChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotifyChannel fromValue(String value) {
        for (NotifyChannel ch : values()) {
            if (ch.value.equalsIgnoreCase(value) || ch.name().equalsIgnoreCase(value)) {
                return ch;
            }
        }
        throw new IllegalArgumentException("Invalid NotifyChannel: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// post/enums/converters/ContentTypeConverter.java
package com.seuprojeto.reviewit.post.enums.converters;

import com.seuprojeto.reviewit.post.enums.ContentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ContentTypeConverter implements AttributeConverter<ContentType, String> {

    @Override
    public String convertToDatabaseColumn(ContentType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public ContentType convertToEntityAttribute(String value) {
        return value == null ? null : ContentType.fromValue(value);
    }
}
```

```java
// post/enums/converters/GenreConverter.java
package com.seuprojeto.reviewit.post.enums.converters;

import com.seuprojeto.reviewit.post.enums.Genre;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GenreConverter implements AttributeConverter<Genre, String> {

    @Override
    public String convertToDatabaseColumn(Genre attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public Genre convertToEntityAttribute(String value) {
        return value == null ? null : Genre.fromValue(value);
    }
}
```

```java
// post/enums/converters/NotifyChannelConverter.java
package com.seuprojeto.reviewit.post.enums.converters;

import com.seuprojeto.reviewit.post.enums.NotifyChannel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotifyChannelConverter implements AttributeConverter<NotifyChannel, String> {

    @Override
    public String convertToDatabaseColumn(NotifyChannel attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public NotifyChannel convertToEntityAttribute(String value) {
        return value == null ? null : NotifyChannel.fromValue(value);
    }
}
```

#### Entidade

```java
// post/Post.java
package com.seuprojeto.reviewit.post;

import com.seuprojeto.reviewit.post.enums.ContentType;
import com.seuprojeto.reviewit.post.enums.Genre;
import com.seuprojeto.reviewit.post.enums.NotifyChannel;
import com.seuprojeto.reviewit.post.enums.converters.ContentTypeConverter;
import com.seuprojeto.reviewit.post.enums.converters.GenreConverter;
import com.seuprojeto.reviewit.post.enums.converters.NotifyChannelConverter;
import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
public class Post extends BaseEntity {

    @NotNull
    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @NotBlank
    @NotNull
    @Length(min = 5, max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @NotNull
    @Column(name = "content_type", nullable = false, length = 20)
    @Convert(converter = ContentTypeConverter.class)
    private ContentType contentType;

    @NotNull
    @Column(nullable = false, length = 20)
    @Convert(converter = GenreConverter.class)
    private Genre genre;

    @NotBlank
    @NotNull
    @Length(min = 10, max = 5000)
    @Column(nullable = false, length = 5000)
    private String content;

    @Column(name = "notify_enabled", nullable = false)
    private boolean notifyEnabled = false;

    @NotNull
    @Column(name = "notify_channel", nullable = false, length = 20)
    @Convert(converter = NotifyChannelConverter.class)
    private NotifyChannel notifyChannel = NotifyChannel.NONE;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

#### DTOs

```java
// post/dto/PostRequestDTO.java
package com.seuprojeto.reviewit.post.dto;

import com.seuprojeto.reviewit.post.enums.ContentType;
import com.seuprojeto.reviewit.post.enums.Genre;
import com.seuprojeto.reviewit.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

public record PostRequestDTO(
        @NotBlank @NotNull @Length(min = 5, max = 200) String title,
        @NotBlank @NotNull @ValueOfEnum(enumClass = ContentType.class) String contentType,
        @NotBlank @NotNull @ValueOfEnum(enumClass = Genre.class) String genre,
        @NotBlank @NotNull @Length(min = 10, max = 5000) String content
) {}
```

```java
// post/dto/UpdateNotificationSettingsRequestDTO.java
package com.seuprojeto.reviewit.post.dto;

import com.seuprojeto.reviewit.post.enums.NotifyChannel;
import com.seuprojeto.reviewit.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationSettingsRequestDTO(
        boolean notifyEnabled,
        @NotNull @ValueOfEnum(enumClass = NotifyChannel.class) String notifyChannel
) {}
```

```java
// post/dto/PostDTO.java
package com.seuprojeto.reviewit.post.dto;

import com.seuprojeto.reviewit.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record PostDTO(
        UUID id,
        ProfileSummaryDTO author,
        String title,
        String contentType,
        String genre,
        String content,
        boolean notifyEnabled,
        String notifyChannel,
        long likeCount,
        long commentCount,
        Instant createdAt,
        Instant updatedAt
) {}
```

```java
// post/dto/PostPageDTO.java
package com.seuprojeto.reviewit.post.dto;

import java.util.List;

public record PostPageDTO(
        List<PostDTO> posts,
        long totalElements,
        int totalPages
) {}
```

#### Mapper (`@Component`)

```java
// post/dto/mapper/PostMapper.java
package com.seuprojeto.reviewit.post.dto.mapper;

import com.seuprojeto.reviewit.post.Post;
import com.seuprojeto.reviewit.post.dto.PostDTO;
import com.seuprojeto.reviewit.post.dto.PostRequestDTO;
import com.seuprojeto.reviewit.post.enums.ContentType;
import com.seuprojeto.reviewit.post.enums.Genre;
import com.seuprojeto.reviewit.post.enums.NotifyChannel;
import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class PostMapper {

    private final ProfileMapper profileMapper;

    public PostMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public Post toModel(PostRequestDTO dto, UUID authorId) {
        if (dto == null) {
            return null;
        }
        Post post = new Post();
        post.setAuthorId(authorId);
        post.setTitle(dto.title());
        post.setContentType(convertContentType(dto.contentType()));
        post.setGenre(convertGenre(dto.genre()));
        post.setContent(dto.content());
        post.setUpdatedAt(Instant.now());
        return post;
    }

    public PostDTO toDTO(Post post, Profile author, long likeCount, long commentCount) {
        if (post == null) {
            return null;
        }
        return new PostDTO(
                post.getId(),
                profileMapper.toSummaryDTO(author),
                post.getTitle(),
                post.getContentType().getValue(),
                post.getGenre().getValue(),
                post.getContent(),
                post.isNotifyEnabled(),
                post.getNotifyChannel().getValue(),
                likeCount,
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public ContentType convertContentType(String value) {
        return value == null ? null : ContentType.fromValue(value);
    }

    public Genre convertGenre(String value) {
        return value == null ? null : Genre.fromValue(value);
    }

    public NotifyChannel convertNotifyChannel(String value) {
        return value == null ? null : NotifyChannel.fromValue(value);
    }
}
```

#### Exemplo de Controller e Service no padrão Loiane

```java
// post/PostController.java
package com.seuprojeto.reviewit.post;

import com.seuprojeto.reviewit.post.dto.PostDTO;
import com.seuprojeto.reviewit.post.dto.PostPageDTO;
import com.seuprojeto.reviewit.post.dto.PostRequestDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public PostPageDTO findAll(@RequestParam(defaultValue = "0") @PositiveOrZero int page,
                              @RequestParam(defaultValue = "10") @Positive @Max(100) int pageSize) {
        return postService.findAll(page, pageSize);
    }

    @GetMapping("/{id}")
    public PostDTO findById(@PathVariable @NotNull UUID id) {
        return postService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostDTO create(@RequestAttribute("currentUserId") UUID authorId,
                          @RequestBody @Valid PostRequestDTO dto) {
        return postService.create(authorId, dto);
    }

    @PutMapping("/{id}")
    public PostDTO update(@PathVariable @NotNull UUID id,
                          @RequestAttribute("currentUserId") UUID requesterId,
                          @RequestBody @Valid PostRequestDTO dto) {
        return postService.update(id, requesterId, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable @NotNull UUID id,
                       @RequestAttribute("currentUserId") UUID requesterId) {
        postService.delete(id, requesterId);
    }
}
```

```java
// post/PostService.java (trecho demonstrativo de exceções e mappers)
package com.seuprojeto.reviewit.post;

import com.seuprojeto.reviewit.exception.BusinessException;
import com.seuprojeto.reviewit.exception.RecordNotFoundException;
import com.seuprojeto.reviewit.post.dto.PostDTO;
import com.seuprojeto.reviewit.post.dto.PostRequestDTO;
import com.seuprojeto.reviewit.post.dto.mapper.PostMapper;
import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.UUID;

@Service
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final ProfileRepository profileRepository;
    private final PostMapper postMapper;

    public PostService(PostRepository postRepository,
                       ProfileRepository profileRepository,
                       PostMapper postMapper) {
        this.postRepository = postRepository;
        this.profileRepository = profileRepository;
        this.postMapper = postMapper;
    }

    @Transactional
    public PostDTO create(UUID authorId, PostRequestDTO dto) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", authorId));

        Post post = postMapper.toModel(dto, authorId);
        Post saved = postRepository.save(post);
        return postMapper.toDTO(saved, author, 0, 0);
    }

    @Transactional
    public PostDTO update(UUID id, UUID requesterId, PostRequestDTO dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Post", id));

        if (!post.getAuthorId().equals(requesterId)) {
            throw new BusinessException("User is not the author of this post");
        }

        post.setTitle(dto.title());
        post.setContentType(postMapper.convertContentType(dto.contentType()));
        post.setGenre(postMapper.convertGenre(dto.genre()));
        post.setContent(dto.content());
        post.setUpdatedAt(Instant.now());

        Profile author = profileRepository.findById(post.getAuthorId())
                .orElseThrow(() -> new RecordNotFoundException("Profile", post.getAuthorId()));

        return postMapper.toDTO(postRepository.save(post), author, 0, 0);
    }
}
```

---

### 4.3 Domínio Comment (`comment/`)

Não possui enums próprios; reutiliza `ProfileSummaryDTO` via injeção do `ProfileMapper`.

#### Entidade

```java
// comment/Comment.java
package com.seuprojeto.reviewit.comment;

import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
public class Comment extends BaseEntity {

    @NotNull
    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @NotNull
    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @NotBlank
    @NotNull
    @Length(min = 1, max = 2000)
    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
```

#### DTOs

```java
// comment/dto/CommentRequestDTO.java
package com.seuprojeto.reviewit.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

public record CommentRequestDTO(
        @NotBlank @NotNull @Length(min = 1, max = 2000) String content
) {}
```

```java
// comment/dto/CommentDTO.java
package com.seuprojeto.reviewit.comment.dto;

import com.seuprojeto.reviewit.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record CommentDTO(
        UUID id,
        UUID postId,
        ProfileSummaryDTO author,
        String content,
        long likeCount,
        Instant createdAt,
        Instant updatedAt
) {}
```

```java
// comment/dto/CommentPageDTO.java
package com.seuprojeto.reviewit.comment.dto;

import java.util.List;

public record CommentPageDTO(
        List<CommentDTO> comments,
        long totalElements,
        int totalPages
) {}
```

#### Mapper (`@Component`)

```java
// comment/dto/mapper/CommentMapper.java
package com.seuprojeto.reviewit.comment.dto.mapper;

import com.seuprojeto.reviewit.comment.Comment;
import com.seuprojeto.reviewit.comment.dto.CommentDTO;
import com.seuprojeto.reviewit.comment.dto.CommentRequestDTO;
import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class CommentMapper {

    private final ProfileMapper profileMapper;

    public CommentMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public Comment toModel(CommentRequestDTO dto, UUID postId, UUID authorId) {
        if (dto == null) {
            return null;
        }
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorId(authorId);
        comment.setContent(dto.content());
        comment.setUpdatedAt(Instant.now());
        return comment;
    }

    public CommentDTO toDTO(Comment comment, Profile author, long likeCount) {
        if (comment == null) {
            return null;
        }
        return new CommentDTO(
                comment.getId(),
                comment.getPostId(),
                profileMapper.toSummaryDTO(author),
                comment.getContent(),
                likeCount,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
```

---

### 4.4 Domínio Like (`like/`)

Sem enums. A unicidade é garantida no banco com `@UniqueConstraint` e o toggle retorna um record leve.

#### Entidades

```java
// like/PostLike.java
package com.seuprojeto.reviewit.like;

import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "post_likes",
       uniqueConstraints = @UniqueConstraint(name = "uk_post_user", columnNames = {"post_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class PostLike extends BaseEntity {

    @NotNull
    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
```

```java
// like/CommentLike.java
package com.seuprojeto.reviewit.like;

import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "comment_likes",
       uniqueConstraints = @UniqueConstraint(name = "uk_comment_user", columnNames = {"comment_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class CommentLike extends BaseEntity {

    @NotNull
    @Column(name = "comment_id", nullable = false)
    private UUID commentId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
```

#### DTO de Resposta (sem request)

```java
// like/dto/ToggleLikeDTO.java
package com.seuprojeto.reviewit.like.dto;

public record ToggleLikeDTO(boolean liked, long likeCount) {}
```

---

### 4.5 Domínio Moderation (`moderation/`)

Engloba denúncias (`Report`) e ações tomadas pela moderação (`ModerationAction`).

#### Enums e Converters

```java
// moderation/enums/ReportStatus.java
package com.seuprojeto.reviewit.moderation.enums;

public enum ReportStatus {
    PENDING("Pending"),
    RESOLVED("Resolved");

    private final String value;

    ReportStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ReportStatus fromValue(String value) {
        for (ReportStatus st : values()) {
            if (st.value.equalsIgnoreCase(value) || st.name().equalsIgnoreCase(value)) {
                return st;
            }
        }
        throw new IllegalArgumentException("Invalid ReportStatus: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// moderation/enums/ActionType.java
package com.seuprojeto.reviewit.moderation.enums;

public enum ActionType {
    REMOVE("Remove"),
    WARN("Warn"),
    SUSPEND("Suspend"),
    BAN("Ban");

    private final String value;

    ActionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ActionType fromValue(String value) {
        for (ActionType at : values()) {
            if (at.value.equalsIgnoreCase(value) || at.name().equalsIgnoreCase(value)) {
                return at;
            }
        }
        throw new IllegalArgumentException("Invalid ActionType: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// moderation/enums/converters/ReportStatusConverter.java
package com.seuprojeto.reviewit.moderation.enums.converters;

import com.seuprojeto.reviewit.moderation.enums.ReportStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReportStatusConverter implements AttributeConverter<ReportStatus, String> {

    @Override
    public String convertToDatabaseColumn(ReportStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public ReportStatus convertToEntityAttribute(String value) {
        return value == null ? null : ReportStatus.fromValue(value);
    }
}
```

```java
// moderation/enums/converters/ActionTypeConverter.java
package com.seuprojeto.reviewit.moderation.enums.converters;

import com.seuprojeto.reviewit.moderation.enums.ActionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ActionTypeConverter implements AttributeConverter<ActionType, String> {

    @Override
    public String convertToDatabaseColumn(ActionType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public ActionType convertToEntityAttribute(String value) {
        return value == null ? null : ActionType.fromValue(value);
    }
}
```

#### Entidades

```java
// moderation/Report.java
package com.seuprojeto.reviewit.moderation;

import com.seuprojeto.reviewit.moderation.enums.ReportStatus;
import com.seuprojeto.reviewit.moderation.enums.converters.ReportStatusConverter;
import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
public class Report extends BaseEntity {

    @NotNull
    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "comment_id")
    private UUID commentId;

    @NotBlank
    @NotNull
    @Length(min = 5, max = 500)
    @Column(nullable = false, length = 500)
    private String reason;

    @NotNull
    @Column(nullable = false, length = 20)
    @Convert(converter = ReportStatusConverter.class)
    private ReportStatus status = ReportStatus.PENDING;
}
```

```java
// moderation/ModerationAction.java
package com.seuprojeto.reviewit.moderation;

import com.seuprojeto.reviewit.moderation.enums.ActionType;
import com.seuprojeto.reviewit.moderation.enums.converters.ActionTypeConverter;
import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "moderation_actions")
@Getter
@Setter
@NoArgsConstructor
public class ModerationAction extends BaseEntity {

    @NotNull
    @Column(name = "report_id", nullable = false)
    private UUID reportId;

    @NotNull
    @Column(name = "moderator_id", nullable = false)
    private UUID moderatorId;

    @NotNull
    @Column(name = "target_user_id", nullable = false)
    private UUID targetUserId;

    @NotNull
    @Column(name = "action_type", nullable = false, length = 20)
    @Convert(converter = ActionTypeConverter.class)
    private ActionType actionType;

    @Column(name = "duration_days")
    private Integer durationDays;
}
```

#### DTOs

```java
// moderation/dto/ReportRequestDTO.java
package com.seuprojeto.reviewit.moderation.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

import java.util.UUID;

public record ReportRequestDTO(
        UUID postId,
        UUID commentId,
        @NotBlank @Length(min = 5, max = 500) String reason
) {}
```

```java
// moderation/dto/ApplyActionRequestDTO.java
package com.seuprojeto.reviewit.moderation.dto;

import com.seuprojeto.reviewit.moderation.enums.ActionType;
import com.seuprojeto.reviewit.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ApplyActionRequestDTO(
        @NotBlank @NotNull @ValueOfEnum(enumClass = ActionType.class) String actionType,
        @Positive Integer durationDays
) {}
```

```java
// moderation/dto/ReportDTO.java
package com.seuprojeto.reviewit.moderation.dto;

import com.seuprojeto.reviewit.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record ReportDTO(
        UUID id,
        ProfileSummaryDTO reporter,
        UUID postId,
        UUID commentId,
        String reason,
        String status,
        Instant createdAt
) {}
```

```java
// moderation/dto/ReportPageDTO.java
package com.seuprojeto.reviewit.moderation.dto;

import java.util.List;

public record ReportPageDTO(
        List<ReportDTO> reports,
        long totalElements,
        int totalPages
) {}
```

```java
// moderation/dto/ModerationActionDTO.java
package com.seuprojeto.reviewit.moderation.dto;

import com.seuprojeto.reviewit.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record ModerationActionDTO(
        UUID id,
        UUID reportId,
        ProfileSummaryDTO moderator,
        ProfileSummaryDTO targetUser,
        String actionType,
        Integer durationDays,
        Instant createdAt
) {}
```

#### Mappers (`@Component`)

```java
// moderation/dto/mapper/ReportMapper.java
package com.seuprojeto.reviewit.moderation.dto.mapper;

import com.seuprojeto.reviewit.moderation.Report;
import com.seuprojeto.reviewit.moderation.dto.ReportDTO;
import com.seuprojeto.reviewit.moderation.dto.ReportRequestDTO;
import com.seuprojeto.reviewit.moderation.enums.ReportStatus;
import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ReportMapper {

    private final ProfileMapper profileMapper;

    public ReportMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public Report toModel(ReportRequestDTO dto, UUID reporterId) {
        if (dto == null) {
            return null;
        }
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setPostId(dto.postId());
        report.setCommentId(dto.commentId());
        report.setReason(dto.reason());
        report.setStatus(ReportStatus.PENDING);
        return report;
    }

    public ReportDTO toDTO(Report report, Profile reporter) {
        if (report == null) {
            return null;
        }
        return new ReportDTO(
                report.getId(),
                profileMapper.toSummaryDTO(reporter),
                report.getPostId(),
                report.getCommentId(),
                report.getReason(),
                report.getStatus().getValue(),
                report.getCreatedAt()
        );
    }
}
```

```java
// moderation/dto/mapper/ModerationActionMapper.java
package com.seuprojeto.reviewit.moderation.dto.mapper;

import com.seuprojeto.reviewit.moderation.ModerationAction;
import com.seuprojeto.reviewit.moderation.dto.ApplyActionRequestDTO;
import com.seuprojeto.reviewit.moderation.dto.ModerationActionDTO;
import com.seuprojeto.reviewit.moderation.enums.ActionType;
import com.seuprojeto.reviewit.profile.Profile;
import com.seuprojeto.reviewit.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ModerationActionMapper {

    private final ProfileMapper profileMapper;

    public ModerationActionMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public ModerationAction toModel(ApplyActionRequestDTO dto, UUID reportId, UUID moderatorId, UUID targetUserId) {
        if (dto == null) {
            return null;
        }
        ModerationAction action = new ModerationAction();
        action.setReportId(reportId);
        action.setModeratorId(moderatorId);
        action.setTargetUserId(targetUserId);
        action.setActionType(ActionType.fromValue(dto.actionType()));
        action.setDurationDays(dto.durationDays());
        return action;
    }

    public ModerationActionDTO toDTO(ModerationAction action, Profile moderator, Profile targetUser) {
        if (action == null) {
            return null;
        }
        return new ModerationActionDTO(
                action.getId(),
                action.getReportId(),
                profileMapper.toSummaryDTO(moderator),
                profileMapper.toSummaryDTO(targetUser),
                action.getActionType().getValue(),
                action.getDurationDays(),
                action.getCreatedAt()
        );
    }
}
```

---

### 4.6 Domínio Notification (`notification/`)

Disparada por eventos de sistema. Os DTOs compreendem a leitura e consulta paginada.

#### Enums e Converters

```java
// notification/enums/NotificationType.java
package com.seuprojeto.reviewit.notification.enums;

public enum NotificationType {
    LIKE_MILESTONE("Like Milestone"),
    NEW_COMMENT("New Comment");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static NotificationType fromValue(String value) {
        for (NotificationType nt : values()) {
            if (nt.value.equalsIgnoreCase(value) || nt.name().equalsIgnoreCase(value)) {
                return nt;
            }
        }
        throw new IllegalArgumentException("Invalid NotificationType: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// notification/enums/DeliveryChannel.java
package com.seuprojeto.reviewit.notification.enums;

public enum DeliveryChannel {
    IN_APP("In-App"),
    EMAIL("Email");

    private final String value;

    DeliveryChannel(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static DeliveryChannel fromValue(String value) {
        for (DeliveryChannel dc : values()) {
            if (dc.value.equalsIgnoreCase(value) || dc.name().equalsIgnoreCase(value)) {
                return dc;
            }
        }
        throw new IllegalArgumentException("Invalid DeliveryChannel: " + value);
    }

    @Override
    public String toString() {
        return value; // required for @ValueOfEnum
    }
}
```

```java
// notification/enums/converters/NotificationTypeConverter.java
package com.seuprojeto.reviewit.notification.enums.converters;

import com.seuprojeto.reviewit.notification.enums.NotificationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public NotificationType convertToEntityAttribute(String value) {
        return value == null ? null : NotificationType.fromValue(value);
    }
}
```

```java
// notification/enums/converters/DeliveryChannelConverter.java
package com.seuprojeto.reviewit.notification.enums.converters;

import com.seuprojeto.reviewit.notification.enums.DeliveryChannel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DeliveryChannelConverter implements AttributeConverter<DeliveryChannel, String> {

    @Override
    public String convertToDatabaseColumn(DeliveryChannel attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public DeliveryChannel convertToEntityAttribute(String value) {
        return value == null ? null : DeliveryChannel.fromValue(value);
    }
}
```

#### Entidade

```java
// notification/Notification.java
package com.seuprojeto.reviewit.notification;

import com.seuprojeto.reviewit.notification.enums.DeliveryChannel;
import com.seuprojeto.reviewit.notification.enums.NotificationType;
import com.seuprojeto.reviewit.notification.enums.converters.DeliveryChannelConverter;
import com.seuprojeto.reviewit.notification.enums.converters.NotificationTypeConverter;
import com.seuprojeto.reviewit.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @NotNull
    @Column(nullable = false, length = 30)
    @Convert(converter = NotificationTypeConverter.class)
    private NotificationType type;

    @NotNull
    @Column(nullable = false, length = 20)
    @Convert(converter = DeliveryChannelConverter.class)
    private DeliveryChannel channel;

    @Column(name = "read_at")
    private Instant readAt;
}
```

#### DTOs

```java
// notification/dto/MarkAsReadRequestDTO.java
package com.seuprojeto.reviewit.notification.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record MarkAsReadRequestDTO(
        @NotNull @NotEmpty List<UUID> notificationIds
) {}
```

```java
// notification/dto/NotificationDTO.java
package com.seuprojeto.reviewit.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDTO(
        UUID id,
        UUID postId,
        String type,
        String channel,
        Instant createdAt,
        Instant readAt
) {}
```

```java
// notification/dto/NotificationPageDTO.java
package com.seuprojeto.reviewit.notification.dto;

import java.util.List;

public record NotificationPageDTO(
        List<NotificationDTO> notifications,
        long totalElements,
        int totalPages
) {}
```

#### Mapper (`@Component`)

```java
// notification/dto/mapper/NotificationMapper.java
package com.seuprojeto.reviewit.notification.dto.mapper;

import com.seuprojeto.reviewit.notification.Notification;
import com.seuprojeto.reviewit.notification.dto.NotificationDTO;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification notification) {
        if (notification == null) {
            return null;
        }
        return new NotificationDTO(
                notification.getId(),
                notification.getPostId(),
                notification.getType().getValue(),
                notification.getChannel().getValue(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
```

---

## 5. Tabela Comparativa de Componentes por Domínio

| Domínio | Requests DTO | Responses DTO | Mapper (`@Component`) | Enums Dedicados |
|---|---|---|---|---|
| **Profile** | `ProfileRequestDTO` | `ProfileDTO`, `ProfileSummaryDTO`, `ProfilePageDTO` | `ProfileMapper` | `Role`, `AccountStatus` |
| **Post** | `PostRequestDTO`, `UpdateNotificationSettingsRequestDTO` | `PostDTO`, `PostPageDTO` | `PostMapper` (injeta `ProfileMapper`) | `ContentType`, `Genre`, `NotifyChannel` |
| **Comment** | `CommentRequestDTO` | `CommentDTO`, `CommentPageDTO` | `CommentMapper` (injeta `ProfileMapper`) | *(nenhum)* |
| **Like** | *(nenhum - toggle direto)* | `ToggleLikeDTO` | *(lógica de montagem no Service)* | *(nenhum)* |
| **Moderation** | `ReportRequestDTO`, `ApplyActionRequestDTO` | `ReportDTO`, `ReportPageDTO`, `ModerationActionDTO` | `ReportMapper`, `ModerationActionMapper` | `ReportStatus`, `ActionType` |
| **Notification** | `MarkAsReadRequestDTO` | `NotificationDTO`, `NotificationPageDTO` | `NotificationMapper` | `NotificationType`, `DeliveryChannel` |

---

## 6. Vantagens da Adoção do Padrão Loiane (`crud-angular-spring`)

1. **Desacoplamento Seguro no Banco**: Através dos `AttributeConverter` e do método `getValue()`, o banco de dados armazena valores estáveis e legíveis sem ficar refém do nome da constante no Java (`.name()`).
2. **Conformidade com RFC 7807 (`ProblemDetail`)**: A API expõe erros no padrão canônico do ecossistema Spring Boot 3+, fornecendo detalhamento automático de erros de validação (`errors: [{ field, message }]`) sem classes complexas de envelopamento de erro customizadas.
3. **Total Compatibilidade com Java Records**: A escolha por Mappers manuais com `@Component` evita atritos clássicos de bibliotecas como ModelMapper e MapStruct ao operar com Records imutáveis e agrega total controle e rastreabilidade ao processo de mapeamento e enriquecimento de dados.
4. **Validações Fortes de Ponta a Ponta**: A combinação do Bean Validation com o `@ValueOfEnum` customizado impede requisições corrompidas logo na entrada do Controller, aliviando os Services de checagens repetitivas de integridade de dados.
