package com.pedrorohloff.profile.dto;

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
) {
}
