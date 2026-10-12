package com.pedrorohloff.moderation.dto;

import java.util.UUID;

public record ReportDTO(
        UUID id,
        UUID reporterId,
        UUID postId,
        UUID commentId,
        String reason,
        String status
) {
}
