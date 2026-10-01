package com.pedrorohloff.post.dto;

import com.pedrorohloff.post.enums.NotifyChannel;
import com.pedrorohloff.shared.validation.ValueOfEnum;
import jakarta.validation.constraints.NotNull;

public record UpdateNotificationSettingsRequestDTO(
        boolean notifyEnabled,
        @NotNull @ValueOfEnum(enumClass = NotifyChannel.class) String notifyChannel
) {
}
