package com.pedrorohloff.notification;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.notification.dto.MarkAsReadRequestDTO;
import com.pedrorohloff.notification.dto.NotificationPageDTO;
import com.pedrorohloff.notification.enums.DeliveryChannel;
import com.pedrorohloff.notification.enums.NotificationType;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class NotificationServiceTest extends AbstractIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldCreateNotification() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify1"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));

        notificationService.createNotification(user.getId(), post.getId(), "Like Milestone", "In-App");

        var notifications = notificationRepository.findAll();
        assertTrue(notifications.stream()
                .anyMatch(n -> n.getUserId().equals(user.getId()) && n.getPostId().equals(post.getId())));
    }

    @Test
    void shouldReturnPaginatedListOfNotificationsForUser() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify2"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user.getId(), post.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user.getId(), post.getId()));

        NotificationPageDTO result = notificationService.findForUser(user.getId(), 0, 10);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoNotificationsExist() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify3"));

        NotificationPageDTO result = notificationService.findForUser(user.getId(), 0, 10);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertEquals(0, result.totalPages());
        assertFalse(result.hasNext());
    }

    @Test
    void shouldMarkNotificationAsRead() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify4"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user.getId(), post.getId()));

        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());
        notificationService.markAsRead(notification.getId(), user.getId(), dto);

        Notification updated = notificationRepository.findById(notification.getId()).orElseThrow();
        assertNotNull(updated.getReadAt());
    }

    @Test
    void shouldMarkAsReadWithNullReadAtDefaultsToNow() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify5"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user.getId(), post.getId()));

        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(null);
        notificationService.markAsRead(notification.getId(), user.getId(), dto);

        Notification updated = notificationRepository.findById(notification.getId()).orElseThrow();
        assertNotNull(updated.getReadAt());
    }

    @Test
    void shouldOnlyReturnNotificationsForRequestedUser() {
        Profile user1 = profileRepository.save(TestDataFactory.createProfile("notify6"));
        Profile user2 = profileRepository.save(TestDataFactory.createProfile("notify7"));
        Post post = postRepository.save(TestDataFactory.createPost(user1.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user1.getId(), post.getId()));
        notificationRepository.save(TestDataFactory.createNotification(user2.getId(), post.getId()));

        NotificationPageDTO result = notificationService.findForUser(user1.getId(), 0, 10);

        assertNotNull(result);
        assertEquals(1, result.totalElements());
        assertTrue(result.notifications().stream().allMatch(n -> n.userId().equals(user1.getId())));
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowForbiddenWhenMarkingAnotherUsersNotificationAsRead() {
        Profile user1 = profileRepository.save(TestDataFactory.createProfile("notify8"));
        Profile user2 = profileRepository.save(TestDataFactory.createProfile("notify9"));
        Post post = postRepository.save(TestDataFactory.createPost(user1.getId()));
        Notification notification = notificationRepository.save(
                TestDataFactory.createNotification(user1.getId(), post.getId()));

        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());

        assertThrows(ForbiddenException.class, () -> notificationService.markAsRead(notification.getId(), user2.getId(), dto));
    }

    @Test
    void shouldThrowNotFoundWhenMarkingNonExistentNotificationAsRead() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("notify10"));
        MarkAsReadRequestDTO dto = new MarkAsReadRequestDTO(Instant.now());

        assertThrows(RecordNotFoundException.class, () -> notificationService.markAsRead(UUID.randomUUID(), user.getId(), dto));
    }
}
