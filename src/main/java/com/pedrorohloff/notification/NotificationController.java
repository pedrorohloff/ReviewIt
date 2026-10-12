package com.pedrorohloff.notification;

import com.pedrorohloff.notification.dto.MarkAsReadRequestDTO;
import com.pedrorohloff.notification.dto.NotificationPageDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationPageDTO findForUser(@RequestAttribute("currentUserId") UUID userId,
                                           @RequestParam(defaultValue = "0") @PositiveOrZero int page,
                                           @RequestParam(defaultValue = "10") @Positive @Max(100) int pageSize) {
        return notificationService.findForUser(userId, page, pageSize);
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable @NotNull UUID id,
                           @RequestAttribute("currentUserId") UUID userId,
                           @RequestBody @Valid MarkAsReadRequestDTO dto) {
        notificationService.markAsRead(id, userId, dto);
    }
}
