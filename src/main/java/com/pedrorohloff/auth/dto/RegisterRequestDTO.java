package com.pedrorohloff.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record RegisterRequestDTO(
        @NotBlank @Length(min = 3, max = 50) String username,
        @NotBlank @Email @Length(max = 320) String email,
        @NotBlank @Length(min = 10, max = 64) String password
) {
}
