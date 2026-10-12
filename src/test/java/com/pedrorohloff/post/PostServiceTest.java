package com.pedrorohloff.post;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostPageDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PostServiceTest extends AbstractIntegrationTest {

    @Autowired
    private PostService postService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldReturnPaginatedListOfPosts() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author1"));
        postRepository.save(TestDataFactory.createPost(author.getId()));
        postRepository.save(TestDataFactory.createPost(author.getId()));

        PostPageDTO result = postService.findAll(0, 10);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoPostsExist() {
        PostPageDTO result = postService.findAll(0, 10);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertEquals(0, result.totalPages());
        assertFalse(result.hasNext());
    }

    @Test
    void shouldFindPostById() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author2"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        PostDTO result = postService.findById(saved.getId());

        assertNotNull(result);
        assertEquals(saved.getId(), result.id());
        assertNotNull(result.author());
        assertEquals(author.getId(), result.author().id());
    }

    @Test
    void shouldCreatePost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author3"));
        PostRequestDTO dto = new PostRequestDTO("My New Post", "Movie", "Comedy", "Great movie review content.");

        PostDTO result = postService.create(author.getId(), dto);

        assertNotNull(result);
        assertNotNull(result.id());
        assertEquals("My New Post", result.title());
        assertEquals("Movie", result.contentType());
        assertEquals("Comedy", result.genre());
    }

    @Test
    void shouldUpdateOwnPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author4"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        PostRequestDTO dto = new PostRequestDTO("Updated Title", "Book", "Drama", "Updated content.");

        PostDTO result = postService.update(saved.getId(), author.getId(), dto);

        assertNotNull(result);
        assertEquals("Updated Title", result.title());
        assertEquals("Drama", result.genre());
    }

    @Test
    void shouldDeleteOwnPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author5"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        postService.delete(saved.getId(), author.getId());

        assertFalse(postRepository.findById(saved.getId()).isPresent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowNotFoundWhenPostDoesNotExist() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> postService.findById(randomId));
    }

    @Test
    void shouldThrowForbiddenWhenUpdatingAnotherUsersPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author6"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        UUID otherUserId = UUID.randomUUID();
        PostRequestDTO dto = new PostRequestDTO("Hacked", "Book", "Action", "Hacked content.");

        assertThrows(ForbiddenException.class, () -> postService.update(saved.getId(), otherUserId, dto));
    }

    @Test
    void shouldThrowForbiddenWhenDeletingAnotherUsersPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author7"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        UUID otherUserId = UUID.randomUUID();

        assertThrows(ForbiddenException.class, () -> postService.delete(saved.getId(), otherUserId));
    }

    @Test
    void shouldThrowNotFoundWhenUpdatingNonExistentPost() {
        UUID randomId = UUID.randomUUID();
        PostRequestDTO dto = new PostRequestDTO("Ghost", "Book", "Action", "Ghost content.");

        assertThrows(RecordNotFoundException.class, () -> postService.update(randomId, randomId, dto));
    }

    @Test
    void shouldThrowNotFoundWhenDeletingNonExistentPost() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> postService.delete(randomId, randomId));
    }

    @Test
    void shouldThrowBusinessExceptionWhenCreatingPostAsSuspendedUser() {
        Profile suspended = profileRepository.save(TestDataFactory.createProfile(
                "suspended_author", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        assertThrows(BusinessException.class, () -> postService.create(suspended.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenCreatingPostAsBannedUser() {
        Profile banned = profileRepository.save(TestDataFactory.createProfile(
                "banned_author", Role.REGULAR, AccountStatus.BANNED, null));
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        assertThrows(BusinessException.class, () -> postService.create(banned.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenUpdatingPostAsSuspendedUser() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author8"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        author.setAccountStatus(AccountStatus.SUSPENDED);
        author.setSuspendedUntil(Instant.now().plusSeconds(3600));
        profileRepository.save(author);
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        assertThrows(BusinessException.class, () -> postService.update(saved.getId(), author.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenUpdatingPostAsBannedUser() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author9"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        author.setAccountStatus(AccountStatus.BANNED);
        profileRepository.save(author);
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        assertThrows(BusinessException.class, () -> postService.update(saved.getId(), author.getId(), dto));
    }
}
