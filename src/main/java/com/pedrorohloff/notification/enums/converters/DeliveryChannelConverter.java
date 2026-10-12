package com.pedrorohloff.notification.enums.converters;

import com.pedrorohloff.notification.enums.DeliveryChannel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DeliveryChannelConverter implements AttributeConverter<DeliveryChannel, String> {

    @Override
    public String convertToDatabaseColumn(DeliveryChannel channel) {
        return channel == null ? null : channel.getValue();
    }

    @Override
    public DeliveryChannel convertToEntityAttribute(String value) {
        return value == null ? null : DeliveryChannel.fromValue(value);
    }
}
