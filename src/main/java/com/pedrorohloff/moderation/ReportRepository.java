package com.pedrorohloff.moderation;

import com.pedrorohloff.moderation.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    Optional<Report> findByReporterIdAndPostIdAndCommentId(UUID reporterId, UUID postId, UUID commentId);

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);
}
