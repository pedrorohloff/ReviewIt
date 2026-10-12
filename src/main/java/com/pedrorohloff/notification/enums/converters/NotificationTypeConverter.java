package com.pedrorohloff.notification.enums.converters;

import com.pedrorohloff.notification.enums.NotificationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType type) {
        return type == null ? null : type.getValue();
    }

    @Override
    public NotificationType convertToEntityAttribute(String value) {
        return value == null ? null : NotificationType.fromValue(value);
    }
}
