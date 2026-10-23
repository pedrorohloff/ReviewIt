package com.pedrorohloff.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.Length;

public record LoginRequestDTO(
        @NotBlank @Email @Length(max = 320) String email,
        @NotBlank @Length(max = 64) String password
) {
}
