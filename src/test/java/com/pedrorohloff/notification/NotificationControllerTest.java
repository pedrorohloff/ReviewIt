package com.pedrorohloff.notification;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.notification.dto.MarkAsReadRequestDTO;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class NotificationControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldListNotifications() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify_user1"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user.getId(), post.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user.getId(), post.getId()));

        mockMvc.perform(get("/api/v1/notifications")
                        .requestAttr("currentUserId", user.getId())
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void shouldReturnEmptyPageWhenNoNotifications() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify_user2"));

        mockMvc.perform(get("/api/v1/notifications")
                        .requestAttr("currentUserId", user.getId())
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void shouldMarkNotificationAsRead() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify_user3"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user.getId(), post.getId()));
        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notification.getId())
                        .requestAttr("currentUserId", user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldOnlyReturnNotificationsForRequestedUser() throws Exception {
        Profile user1 = profileRepository.save(TestDataFactory.createProfile("notify_user4"));
        Profile user2 = profileRepository.save(TestDataFactory.createProfile("notify_user5"));
        Post post = postRepository.save(TestDataFactory.createPost(user1.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user1.getId(), post.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user2.getId(), post.getId()));

        mockMvc.perform(get("/api/v1/notifications")
                        .requestAttr("currentUserId", user1.getId())
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn403WhenMarkingAnotherUsersNotificationAsRead() throws Exception {
        Profile user1 = profileRepository.save(TestDataFactory.createProfile("notify_user6"));
        Profile user2 = profileRepository.save(TestDataFactory.createProfile("notify_user7"));
        Post post = postRepository.save(TestDataFactory.createPost(user1.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user1.getId(), post.getId()));
        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notification.getId())
                        .requestAttr("currentUserId", user2.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn404WhenMarkingNonExistentNotificationAsRead() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify_user8"));
        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", UUID.randomUUID())
                        .requestAttr("currentUserId", user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn400WhenMarkAsReadWithInvalidBody() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify_user9"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user.getId(), post.getId()));

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", notification.getId())
                        .requestAttr("currentUserId", user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
