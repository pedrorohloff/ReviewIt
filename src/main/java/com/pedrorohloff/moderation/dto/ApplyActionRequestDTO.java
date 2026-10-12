package com.pedrorohloff.moderation.dto;

import com.pedrorohloff.moderation.enums.ActionType;
import com.pedrorohloff.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotNull;

public record ApplyActionRequestDTO(
        @NotNull
        @ValueOfEnum(enumClass = ActionType.class)
        String actionType,

        Integer durationDays
) {
}
