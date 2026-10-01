package com.pedrorohloff.profile.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record ProfileRequestDTO(
        @NotBlank @Length(min = 3, max = 50) String username,
        @Length(max = 500) String avatarUrl
) {
}
