package com.pedrorohloff.notification;

import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.notification.dto.MarkAsReadRequestDTO;
import com.pedrorohloff.notification.dto.NotificationDTO;
import com.pedrorohloff.notification.dto.NotificationPageDTO;
import com.pedrorohloff.notification.dto.mapper.NotificationMapper;
import com.pedrorohloff.notification.enums.DeliveryChannel;
import com.pedrorohloff.notification.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
    }

    @Transactional
    public void createNotification(UUID userId, UUID postId, String type, String channel) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setPostId(postId);
        notification.setType(NotificationType.fromValue(type));
        notification.setChannel(DeliveryChannel.fromValue(channel));
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public NotificationPageDTO findForUser(UUID userId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Notification> notificationPage = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);

        var notifications = notificationPage.getContent().stream()
                .map(notificationMapper::toDTO)
                .toList();

        return new NotificationPageDTO(
                notifications,
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.hasNext()
        );
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId, MarkAsReadRequestDTO dto) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RecordNotFoundException("Notification", notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You can only mark your own notifications as read");
        }

        notification.setReadAt(dto.readAt() != null ? dto.readAt() : Instant.now());
        notificationRepository.save(notification);
    }
}
