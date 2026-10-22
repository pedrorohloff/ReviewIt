package com.pedrorohloff.moderation;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.moderation.dto.ApplyActionRequestDTO;
import com.pedrorohloff.moderation.dto.ReportRequestDTO;
import com.pedrorohloff.moderation.enums.ReportStatus;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class ModerationControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldCreateReportForPost() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter1"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        ReportRequestDTO dto = new ReportRequestDTO(post.getId(), null, "Spam content");

        mockMvc.perform(post("/api/v1/reports")
                        .requestAttr("currentUserId", reporter.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Pending"));
    }

    @Test
    void shouldCreateReportForComment() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter2"));
        UUID commentId = UUID.randomUUID();
        ReportRequestDTO dto = new ReportRequestDTO(null, commentId, "Offensive comment");

        mockMvc.perform(post("/api/v1/reports")
                        .requestAttr("currentUserId", reporter.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("Pending"));
    }

    @Test
    void shouldListReports() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter3"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));

        mockMvc.perform(get("/api/v1/reports")
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void shouldFilterReportsByStatus() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporterFilter"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        var pending = reportRepository.save(TestDataFactory.createReport(
                reporter.getId(), post.getId(), null, "Pending report", ReportStatus.PENDING));
        var resolved = reportRepository.save(TestDataFactory.createReport(
                reporter.getId(), post.getId(), null, "Resolved report", ReportStatus.RESOLVED));

        mockMvc.perform(get("/api/v1/reports")
                        .param("page", "0")
                        .param("pageSize", "100")
                        .param("status", "Pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", everyItem(is("Pending"))))
                .andExpect(jsonPath("$.content[*].id", hasItem(pending.getId().toString())))
                .andExpect(jsonPath("$.content[*].id", not(hasItem(resolved.getId().toString()))));

        mockMvc.perform(get("/api/v1/reports")
                        .param("page", "0")
                        .param("pageSize", "100")
                        .param("status", "Resolved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].status", everyItem(is("Resolved"))))
                .andExpect(jsonPath("$.content[*].id", hasItem(resolved.getId().toString())))
                .andExpect(jsonPath("$.content[*].id", not(hasItem(pending.getId().toString()))));

        mockMvc.perform(get("/api/v1/reports").param("status", "Banana"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldApplyWarnAction() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter4"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod1", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionType").value("Warn"));
    }

    @Test
    void shouldApplyRemoveAction() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter5"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod2", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Remove", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionType").value("Remove"));
    }

    @Test
    void shouldApplySuspendAction() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter6"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod3", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Suspend", 7);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionType").value("Suspend"))
                .andExpect(jsonPath("$.durationDays").value(7));
    }

    @Test
    void shouldApplyBanAction() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter7"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod4", Role.ADMIN));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Ban", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actionType").value("Ban"));
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn400WhenReportingBothPostAndComment() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter8"));
        ReportRequestDTO dto = new ReportRequestDTO(UUID.randomUUID(), UUID.randomUUID(), "Invalid");

        mockMvc.perform(post("/api/v1/reports")
                        .requestAttr("currentUserId", reporter.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn400WhenReportingNeitherPostNorComment() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter9"));
        ReportRequestDTO dto = new ReportRequestDTO(null, null, "Invalid");

        mockMvc.perform(post("/api/v1/reports")
                        .requestAttr("currentUserId", reporter.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenDuplicateReport() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter10"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ReportRequestDTO dto = new ReportRequestDTO(post.getId(), null, "Duplicate");

        mockMvc.perform(post("/api/v1/reports")
                        .requestAttr("currentUserId", reporter.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn403WhenNonModeratorAppliesAction() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter11"));
        Profile regular = profileRepository.save(TestDataFactory.createProfile("regular1"));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", regular.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn404WhenReportNotFound() throws Exception {
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod5", Role.MODERATOR));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", UUID.randomUUID())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn409WhenReportAlreadyResolved() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter12"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod6", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Warn", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenSuspendWithoutDuration() throws Exception {
        Profile reporter = profileRepository.save(TestDataFactory.createProfile("reporter13"));
        Profile moderator = profileRepository.save(TestDataFactory.createProfile("mod7", Role.MODERATOR));
        Post post = postRepository.save(TestDataFactory.createPost(reporter.getId()));
        Report report = reportRepository.save(TestDataFactory.createReport(reporter.getId(), post.getId()));
        ApplyActionRequestDTO dto = new ApplyActionRequestDTO("Suspend", null);

        mockMvc.perform(post("/api/v1/reports/{reportId}/action", report.getId())
                        .requestAttr("currentUserId", moderator.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }
}
