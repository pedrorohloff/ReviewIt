package com.pedrorohloff.comment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CommentDTO(
        @Valid UUID id,
        @Valid UUID postId,
        @Valid UUID authorId,
        @NotBlank @NotNull String content
) {
}
