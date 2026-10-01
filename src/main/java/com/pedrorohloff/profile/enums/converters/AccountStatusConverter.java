package com.pedrorohloff.profile.enums.converters;

import com.pedrorohloff.profile.enums.AccountStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AccountStatusConverter implements AttributeConverter<AccountStatus, String> {

    @Override
    public String convertToDatabaseColumn(AccountStatus accountStatus) {
        return accountStatus == null ? null : accountStatus.getValue();
    }

    @Override
    public AccountStatus convertToEntityAttribute(String value) {
        return value == null ? null : AccountStatus.fromValue(value);
    }
}
