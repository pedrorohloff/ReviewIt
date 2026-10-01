package com.pedrorohloff.post.enums.converters;

import com.pedrorohloff.post.enums.NotifyChannel;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotifyChannelConverter implements AttributeConverter<NotifyChannel,String> {

    @Override
    public String convertToDatabaseColumn(NotifyChannel notifyChannel) {

        return notifyChannel == null ? null : notifyChannel.getValue();
    }

    @Override
    public NotifyChannel convertToEntityAttribute(String value) {
        return value == null ? null : NotifyChannel.valueOf(value);
    }
}
