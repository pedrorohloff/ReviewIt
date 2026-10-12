package com.pedrorohloff.moderation.dto.mapper;

import com.pedrorohloff.moderation.Report;
import com.pedrorohloff.moderation.dto.ReportDTO;
import com.pedrorohloff.moderation.dto.ReportRequestDTO;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ReportMapper {

    public ReportDTO toDTO(Report report) {
        if (report == null) {
            return null;
        }
        return new ReportDTO(
                report.getId(),
                report.getReporterId(),
                report.getPostId(),
                report.getCommentId(),
                report.getReason(),
                report.getStatus().getValue()
        );
    }

    public Report toModel(ReportRequestDTO dto, UUID reporterId) {
        if (dto == null) {
            return null;
        }
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setPostId(dto.postId());
        report.setCommentId(dto.commentId());
        report.setReason(dto.reason());
        return report;
    }
}
