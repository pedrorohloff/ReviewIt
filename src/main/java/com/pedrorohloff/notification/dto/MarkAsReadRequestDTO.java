package com.pedrorohloff.notification.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record MarkAsReadRequestDTO(
        @NotNull
        Instant readAt
) {
}
