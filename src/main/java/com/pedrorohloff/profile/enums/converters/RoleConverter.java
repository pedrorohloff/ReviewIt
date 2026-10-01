package com.pedrorohloff.profile.enums.converters;

import com.pedrorohloff.profile.enums.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? null : role.getValue();
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        return value == null ? null : Role.fromValue(value);
    }
}
