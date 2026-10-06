package com.pedrorohloff.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

public record CommentRequestDTO(
        @NotBlank @NotNull @Length(min = 1, max = 2000) String content
) {}
