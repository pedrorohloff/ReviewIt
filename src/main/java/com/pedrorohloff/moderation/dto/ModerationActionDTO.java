package com.pedrorohloff.moderation.dto;

import java.util.UUID;

public record ModerationActionDTO(
        UUID reportId,
        UUID moderatorId,
        UUID targetUserId,
        String actionType,
        int durationDays
) {
}
