package com.pedrorohloff.moderation;

import com.pedrorohloff.moderation.enums.ActionType;
import com.pedrorohloff.moderation.enums.converters.ActionTypeConverter;
import com.pedrorohloff.shared.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "moderation_actions")
@Getter
@Setter
@NoArgsConstructor
public class ModerationAction extends BaseEntity {

    @Column(name = "report_id", nullable = false)
    private UUID reportId;

    @Column(nullable = false, name = "moderator_id")
    private UUID moderatorId;

    @Column(nullable = false, name = "target_user_id")
    private UUID targetUserId;

    @Column(nullable = false, name = "action_type")
    @Convert(converter = ActionTypeConverter.class)
    private ActionType actionType;

    @Column(name = "duration_days")
    private Integer durationDays;

}
