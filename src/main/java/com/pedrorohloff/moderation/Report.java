package com.pedrorohloff.moderation;

import com.pedrorohloff.moderation.enums.ReportStatus;
import com.pedrorohloff.moderation.enums.converters.ReportStatusConverter;
import com.pedrorohloff.shared.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "reports", uniqueConstraints = @UniqueConstraint(
        columnNames = {"reporter_id", "post_id", "comment_id"}
))
@Getter
@Setter
@NoArgsConstructor
public class Report extends BaseEntity {
    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "comment_id")
    private UUID commentId;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(nullable = false)
    @Convert(converter = ReportStatusConverter.class)
    private ReportStatus status = ReportStatus.PENDING;

}
