package com.pedrorohloff.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

import java.time.Instant;
import java.util.UUID;

/**
 * Local email/password credentials for a profile.
 *
 * <p>The password hash is a complete BCrypt string, including its salt. There
 * is deliberately no separate salt column.</p>
 */
@Entity
@Table(name = "app_credentials")
@Getter
@Setter
@NoArgsConstructor
public class AppCredential {

    @Id
    @NotNull
    @Column(name = "profile_id", nullable = false, updatable = false)
    private UUID profileId;

    @NotBlank
    @NotNull
    @Email
    @Length(max = 320)
    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @NotBlank
    @NotNull
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
