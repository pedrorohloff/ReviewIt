package com.pedrorohloff.notification.dto;

import java.util.List;

public record NotificationPageDTO(
        List<NotificationDTO> notifications,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
}
