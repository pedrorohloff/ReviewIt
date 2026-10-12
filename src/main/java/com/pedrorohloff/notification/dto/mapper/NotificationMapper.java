package com.pedrorohloff.notification.dto.mapper;

import com.pedrorohloff.notification.Notification;
import com.pedrorohloff.notification.dto.NotificationDTO;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification notification) {
        if (notification == null) {
            return null;
        }
        return new NotificationDTO(
                notification.getId(),
                notification.getUserId(),
                notification.getPostId(),
                notification.getType().getValue(),
                notification.getChannel().getValue(),
                notification.getReadAt()
        );
    }
}
