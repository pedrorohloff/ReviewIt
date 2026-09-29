package com.pedrorohloff.profile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProfileDTO(
        @Valid UUID id, // posteriormente criar dto de resposta e request
        @NotNull @NotBlank String username,
        @Valid @NotNull String avatarUrl,
        @Valid @NotNull @NotBlank String role,
        @Valid @NotNull @NotBlank String status
) {
}
