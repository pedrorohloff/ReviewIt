package com.pedrorohloff.post.dto;

import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.validator.constraints.Length;

public record PostRequestDTO(
        @NotBlank @NotNull @Length(min = 5, max = 200) String title,
        @NotBlank @NotNull @ValueOfEnum(enumClass = ContentType.class) String contentType,
        @NotBlank @NotNull @ValueOfEnum(enumClass = Genre.class) String genre,
        @NotBlank @NotNull @Length(min = 10, max = 5000) String content
) {
}
