package com.pedrorohloff.profile.dto;

import java.util.List;

public record ProfilePageDTO(
        List<ProfileDTO> profiles,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
