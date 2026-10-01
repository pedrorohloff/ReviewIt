package com.pedrorohloff.profile.dto;

import java.util.UUID;

public record ProfileSummaryDTO(
        UUID id,
        String username,
        String avatarUrl
) {
}
