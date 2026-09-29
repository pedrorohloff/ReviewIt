package com.pedrorohloff.profile.dto;

import com.pedrorohloff.profile.enums.Role;
import com.pedrorohloff.profile.enums.Status;
import com.pedrorohloff.shared.validation.ValueOfEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProfileDTO(
        @Valid UUID id, // posteriormente criar dto de resposta e request
        @NotNull @NotBlank String username,
        @Valid @NotNull String avatarUrl,
        @Valid @NotNull @NotBlank @ValueOfEnum(enumClass = Role.class) String role,
        @Valid @NotNull @NotBlank @ValueOfEnum(enumClass = Status.class) String status
) {
}
