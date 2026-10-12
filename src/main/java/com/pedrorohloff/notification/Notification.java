package com.pedrorohloff.notification;

import com.pedrorohloff.notification.enums.DeliveryChannel;
import com.pedrorohloff.notification.enums.NotificationType;
import com.pedrorohloff.notification.enums.converters.DeliveryChannelConverter;
import com.pedrorohloff.notification.enums.converters.NotificationTypeConverter;
import com.pedrorohloff.shared.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(nullable = false, name = "type", length = 20)
    @Convert(converter = NotificationTypeConverter.class)
    private NotificationType type;

    @Column(nullable = false, name = "channel", length = 10)
    @Convert(converter = DeliveryChannelConverter.class)
    private DeliveryChannel channel;

    @Column(name = "read_at")
    private Instant readAt;

}
