package com.pedrorohloff.post.dto;

import com.pedrorohloff.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record PostDTO (
        UUID id,
        ProfileSummaryDTO author,
        String title,
        String contentType,
        String genre,
        String content,
        boolean notifyEnabled,
        String notifyChannel,
        long likeCount,
        long commentCount,
        Instant createdAt,
        Instant updatedAt
) {
}
