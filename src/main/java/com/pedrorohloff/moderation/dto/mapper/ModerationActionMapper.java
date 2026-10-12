package com.pedrorohloff.moderation.dto.mapper;

import com.pedrorohloff.moderation.ModerationAction;
import com.pedrorohloff.moderation.dto.ModerationActionDTO;
import org.springframework.stereotype.Component;

@Component
public class ModerationActionMapper {

    public ModerationActionDTO toDTO(ModerationAction action) {
        if (action == null) {
            return null;
        }
        return new ModerationActionDTO(
                action.getReportId(),
                action.getModeratorId(),
                action.getTargetUserId(),
                action.getActionType().getValue(),
                action.getDurationDays()
        );
    }
}
