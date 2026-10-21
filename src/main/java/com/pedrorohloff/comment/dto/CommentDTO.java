package com.pedrorohloff.comment.dto;

import com.pedrorohloff.profile.dto.ProfileSummaryDTO;

import java.time.Instant;
import java.util.UUID;

public record CommentDTO(
        UUID id,
        UUID postId,
        ProfileSummaryDTO author,
        String content,
        long likeCount,
        boolean likedByMe,
        Instant createdAt,
        Instant updatedAt
) {}
