package com.pedrorohloff.moderation;

import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.moderation.dto.ApplyActionRequestDTO;
import com.pedrorohloff.moderation.dto.ModerationActionDTO;
import com.pedrorohloff.moderation.dto.ReportDTO;
import com.pedrorohloff.moderation.dto.ReportPageDTO;
import com.pedrorohloff.moderation.dto.ReportRequestDTO;
import com.pedrorohloff.moderation.dto.mapper.ModerationActionMapper;
import com.pedrorohloff.moderation.dto.mapper.ReportMapper;
import com.pedrorohloff.moderation.enums.ActionType;
import com.pedrorohloff.moderation.enums.ReportStatus;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final ModerationActionRepository moderationActionRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;
    private final ReportMapper reportMapper;
    private final ModerationActionMapper moderationActionMapper;

    public ReportService(ReportRepository reportRepository,
                         ModerationActionRepository moderationActionRepository,
                         PostRepository postRepository,
                         CommentRepository commentRepository,
                         ProfileRepository profileRepository,
                         ReportMapper reportMapper,
                         ModerationActionMapper moderationActionMapper) {
        this.reportRepository = reportRepository;
        this.moderationActionRepository = moderationActionRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
        this.reportMapper = reportMapper;
        this.moderationActionMapper = moderationActionMapper;
    }

    @Transactional
    public ReportDTO create(UUID reporterId, ReportRequestDTO reportRequestDTO) {
        if (reportRequestDTO.postId() == null && reportRequestDTO.commentId() == null) {
            throw new BusinessException("A report must target either a post or a comment");
        }
        if (reportRequestDTO.postId() != null && reportRequestDTO.commentId() != null) {
            throw new BusinessException("A report cannot target both a post and a comment");
        }

        Optional<Report> existing = reportRepository
                .findByReporterIdAndPostIdAndCommentId(reporterId, reportRequestDTO.postId(), reportRequestDTO.commentId());

        if (existing.isPresent()) {
            throw new BusinessException("You already reported this content");
        }

        Report report = reportMapper.toModel(reportRequestDTO, reporterId);
        return reportMapper.toDTO(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public ReportPageDTO findAll(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Report> reportPage = reportRepository.findAll(pageable);

        var reports = reportPage.getContent().stream()
                .map(reportMapper::toDTO)
                .toList();

        return new ReportPageDTO(
                reports,
                reportPage.getTotalElements(),
                reportPage.getTotalPages(),
                reportPage.hasNext()
        );
    }

    @Transactional
    public ModerationActionDTO applyAction(UUID reportId, UUID moderatorId, ApplyActionRequestDTO dto) {
        Profile moderator = profileRepository.findById(moderatorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", moderatorId));

        if (moderator.getRole() != Role.MODERATOR && moderator.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Only moderators can apply actions");
        }

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RecordNotFoundException("Report", reportId));

        if (report.getStatus() == ReportStatus.RESOLVED) {
            throw new BusinessException("This report has already been resolved");
        }

        UUID targetUserId = resolveTargetUserId(report);

        ActionType actionType = ActionType.fromValue(dto.actionType());

        ModerationAction action = new ModerationAction();
        action.setReportId(reportId);
        action.setModeratorId(moderatorId);
        action.setTargetUserId(targetUserId);
        action.setActionType(actionType);
        action.setDurationDays(dto.durationDays());

        applySideEffects(actionType, targetUserId, dto.durationDays(), report);

        report.setStatus(ReportStatus.RESOLVED);
        reportRepository.save(report);

        return moderationActionMapper.toDTO(moderationActionRepository.save(action));
    }

    private UUID resolveTargetUserId(Report report) {
        if (report.getPostId() != null) {
            Post post = postRepository.findById(report.getPostId())
                    .orElseThrow(() -> new RecordNotFoundException("Post", report.getPostId()));
            return post.getAuthorId();
        } else {
            Comment comment = commentRepository.findById(report.getCommentId())
                    .orElseThrow(() -> new RecordNotFoundException("Comment", report.getCommentId()));
            return comment.getAuthorId();
        }
    }

    private void applySideEffects(ActionType actionType, UUID targetUserId, Integer durationDays, Report report) {
        switch (actionType) {
            case REMOVE -> {
                if (report.getPostId() != null) {
                    postRepository.deleteById(report.getPostId());
                } else {
                    commentRepository.deleteById(report.getCommentId());
                }
            }
            case WARN -> {
                // Notification will be implemented in Phase 7
            }
            case SUSPEND -> {
                if (durationDays == null) {
                    throw new BusinessException("Duration is required for suspend action");
                }
                Profile target = profileRepository.findById(targetUserId)
                        .orElseThrow(() -> new RecordNotFoundException("Profile", targetUserId));
                target.setAccountStatus(AccountStatus.SUSPENDED);
                target.setSuspendedUntil(Instant.now().plusSeconds(durationDays * 86400L));
                profileRepository.save(target);
            }
            case BAN -> {
                Profile target = profileRepository.findById(targetUserId)
                        .orElseThrow(() -> new RecordNotFoundException("Profile", targetUserId));
                target.setAccountStatus(AccountStatus.BANNED);
                profileRepository.save(target);
            }
        }
    }
}
