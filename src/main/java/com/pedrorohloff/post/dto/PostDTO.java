package com.pedrorohloff.post.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

import java.util.UUID;

public record PostDTO (
        // pode adicionar @JsonProperty("_id") caso o nome do id no frontend seja _id
        @Valid UUID id,
        @NotBlank @NotNull @Length(min = 5, max = 120) String title,
        @NotBlank @NotNull String content
) {
}
