package com.pedrorohloff.moderation.enums.converters;

import com.pedrorohloff.moderation.enums.ActionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ActionTypeConverter implements AttributeConverter<ActionType, String> {

    @Override
    public String convertToDatabaseColumn(ActionType actionType) {
        return actionType == null ? null : actionType.getValue();
    }

    @Override
    public ActionType convertToEntityAttribute(String value) {
        return value == null ? null : ActionType.fromValue(value);
    }
}
