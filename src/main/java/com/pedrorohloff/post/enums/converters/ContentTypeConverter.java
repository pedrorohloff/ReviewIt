package com.pedrorohloff.post.enums.converters;

import com.pedrorohloff.post.enums.ContentType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ContentTypeConverter implements AttributeConverter<ContentType,String> {

    @Override
    public String convertToDatabaseColumn(ContentType contentType) {
        return contentType == null ? null : contentType.getValue();
    }

    @Override
    public ContentType convertToEntityAttribute(String value) {
        return value == null ? null : ContentType.fromValue(value);
    }
}
