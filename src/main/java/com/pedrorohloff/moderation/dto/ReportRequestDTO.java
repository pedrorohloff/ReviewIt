package com.pedrorohloff.moderation.dto;

import java.util.UUID;

public record ReportRequestDTO(
        UUID postId,
        UUID commentId,
        String reason
) {
}
