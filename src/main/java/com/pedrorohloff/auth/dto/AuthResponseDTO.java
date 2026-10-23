package com.pedrorohloff.auth.dto;

import com.pedrorohloff.profile.dto.ProfileDTO;

import java.time.Instant;

public record AuthResponseDTO(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        String email,
        ProfileDTO profile
) {
}
