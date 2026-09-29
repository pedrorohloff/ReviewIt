package com.pedrorohloff.profile;

import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.profile.enums.Status;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Data
public class Profile {

    // sem @GeneratedValue, vai ser pego diretamente do Supabase (author_id)
    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // retirar depois, apenas para teste
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(nullable = false)
    private Status status = Status.ACTIVE;

    @Column(name = "suspended_until")
    private Instant suspendedUntil;

    @Column(nullable = false, name = "created_at")
    private Instant createdAt = Instant.now();

    public boolean isSuspended() {
        return status == Status.SUSPENDED
                && suspendedUntil != null
                && suspendedUntil.isAfter(Instant.now());
    }

    public boolean isBanned() {
        return status == Status.BANNED;
    }
}
