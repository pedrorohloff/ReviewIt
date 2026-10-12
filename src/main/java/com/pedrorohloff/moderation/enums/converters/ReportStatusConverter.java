package com.pedrorohloff.moderation.enums.converters;

import com.pedrorohloff.moderation.enums.ReportStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReportStatusConverter implements AttributeConverter<ReportStatus, String> {

    @Override
    public String convertToDatabaseColumn(ReportStatus reportStatus) {
        return reportStatus == null ? null : reportStatus.getValue();
    }

    @Override
    public ReportStatus convertToEntityAttribute(String value) {
        return value == null ? null : ReportStatus.fromValue(value);
    }
}
