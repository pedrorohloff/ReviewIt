package com.pedrorohloff.profile;

import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.converters.AccountStatusConverter;
import com.pedrorohloff.profile.enums.converters.RoleConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

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
    @NotNull
    @Length(min = 3, max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Length(max = 500)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @NotNull
    @Length(max = 20)
    @Column(nullable = false, length = 20)
    @Convert(converter = RoleConverter.class)
    private Role role = Role.REGULAR;

    @NotNull
    @Length(max = 20)
    @Column(nullable = false, length = 20)
    @Convert(converter = AccountStatusConverter.class)
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

    @Column(name = "suspended_until")
    private Instant suspendedUntil;

    @Column(nullable = false, name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    public boolean isSuspended() {
        return accountStatus == AccountStatus.SUSPENDED
                && suspendedUntil != null
                && suspendedUntil.isAfter(Instant.now());
    }

    public boolean isBanned() {
        return accountStatus == AccountStatus.BANNED;
    }
}
