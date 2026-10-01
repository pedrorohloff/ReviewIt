package com.pedrorohloff.post.enums.converters;

import com.pedrorohloff.post.enums.Genre;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class GenreConverter implements AttributeConverter<Genre,String> {

    @Override
    public String convertToDatabaseColumn(Genre genre) {
        return genre == null ? null : genre.getValue();
    }

    @Override
    public Genre convertToEntityAttribute(String value) {
        return value == null ? null : Genre.fromValue(value);
    }
}
