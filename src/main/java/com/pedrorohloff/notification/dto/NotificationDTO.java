package com.pedrorohloff.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDTO(
        UUID id,
        UUID userId,
        UUID postId,
        String type,
        String channel,
        Instant readAt
) {
}
