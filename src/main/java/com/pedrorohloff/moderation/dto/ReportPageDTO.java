package com.pedrorohloff.moderation.dto;

import java.util.List;

public record ReportPageDTO(
        List<ReportDTO> content,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
