package com.pedrorohloff.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<Report, UUID> {
    Optional<Report> findByReporterIdAndPostIdAndCommentId(UUID reporterId, UUID postId, UUID commentId);
}
