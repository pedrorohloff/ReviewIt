package com.pedrorohloff.moderation;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.moderation.dto.ApplyActionRequestDTO;
import com.pedrorohloff.moderation.dto.ModerationActionDTO;
import com.pedrorohloff.moderation.dto.ReportDTO;
import com.pedrorohloff.moderation.dto.ReportPageDTO;
import com.pedrorohloff.moderation.dto.ReportRequestDTO;
import com.pedrorohloff.moderation.enums.ActionType;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ReportServiceTest extends AbstractIntegrationTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldCreateReportForPost() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter1"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        ReportRequestDTO dto = new ReportRequestDTO(post.getId(), null, "Spam content");

        ReportDTO result = reportService.create(reporter.getId(), dto);

        assertNotNull(result);
        assertNotNull(result.id());
        assertEquals(post.getId(), result.postId());
        assertEquals("Pending", result.status());
    }

    @Test
    void shouldCreateReportForComment() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter2"));
        UUID commentId = UUID.randomUUID();
        ReportRequestDTO dto = new ReportRequestDTO(null, commentId, "Offensive comment");

        ReportDTO result = reportService.create(reporter.getId(), dto);

        assertNotNull(result);
        assertEquals(commentId, result.commentId());
        assertEquals("Pending", result.status());
    }

    @Test
    void shouldReturnPaginatedListOfReports() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter3"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ReportPageDTO result = reportService.findAll(0, 10);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 1);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldApplyWarnAction() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter4"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod1", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);
        ModerationActionDTO result = reportService.applyAction(report.getId(), moderator.getId(), dto);

        assertNotNull(result);
        assertEquals("Warn", result.actionType());
    }

    @Test
    void shouldApplyRemoveAction() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter5"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod2", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Remove", null);
        ModerationActionDTO result = reportService.applyAction(report.getId(), moderator.getId(), dto);

        assertNotNull(result);
        assertEquals("Remove", result.actionType());
        assertFalse(postRepository.findById(post.getId()).isPresent());
    }

    @Test
    void shouldApplySuspendAction() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter6"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod3", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Suspend", 7);
        ModerationActionDTO result = reportService.applyAction(report.getId(), moderator.getId(), dto);

        assertNotNull(result);
        assertEquals("Suspend", result.actionType());
        assertEquals(7, result.durationDays());
    }

    @Test
    void shouldApplyBanAction() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter7"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod4", Role.ADMIN));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Ban", null);
        ModerationActionDTO result = reportService.applyAction(report.getId(), moderator.getId(), dto);

        assertNotNull(result);
        assertEquals("Ban", result.actionType());
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowBusinessExceptionWhenReportingBothPostAndComment() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter8"));
        ReportRequestDTO dto = new ReportRequestDTO(UUID.randomUUID(), UUID.randomUUID(), "Invalid");

        assertThrows(BusinessException.class, () -> reportService.create(reporter.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenReportingNeitherPostNorComment() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter9"));
        ReportRequestDTO dto = new ReportRequestDTO(null, null, "Invalid");

        assertThrows(BusinessException.class, () -> reportService.create(reporter.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenDuplicateReport() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter10"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ReportRequestDTO dto = new ReportRequestDTO(post.getId(), null, "Duplicate");

        assertThrows(BusinessException.class, () -> reportService.create(reporter.getId(), dto));
    }

    @Test
    void shouldThrowForbiddenWhenNonModeratorAppliesAction() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter11"));
        Profile regular = profileRepository.save(TestDataFactory.createProfile("regular1"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        assertThrows(ForbiddenException.class, () -> reportService.applyAction(report.getId(), regular.getId(), dto));
    }

    @Test
    void shouldThrowNotFoundWhenReportDoesNotExist() {
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod5", Role.MODERATOR));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        assertThrows(RecordNotFoundException.class, () -> reportService.applyAction(UUID.randomUUID(), moderator.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenReportAlreadyResolved() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter12"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod6", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);
        reportService.applyAction(report.getId(), moderator.getId(), dto);

        assertThrows(BusinessException.class, () -> reportService.applyAction(report.getId(), moderator.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenSuspendWithoutDuration() {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter13"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod7", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Suspend", null);

        assertThrows(BusinessException.class, () -> reportService.applyAction(report.getId(), moderator.getId(), dto));
    }
}
