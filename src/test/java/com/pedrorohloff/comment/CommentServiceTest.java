package com.pedrorohloff.comment;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentPageDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CommentServiceTest extends AbstractIntegrationTest {

    @Autowired
    private CommentService commentService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldReturnPaginatedListOfCommentsForPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter1"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        CommentPageDTO result = commentService.findAllByPost(post.getId(), 0, 10);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoCommentsExist() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter2"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));

        CommentPageDTO result = commentService.findAllByPost(post.getId(), 0, 10);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertEquals(0, result.totalPages());
        assertFalse(result.hasNext());
    }

    @Test
    void shouldFindCommentById() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter3"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        CommentDTO result = commentService.findById(saved.getId());

        assertNotNull(result);
        assertEquals(saved.getId(), result.id());
        assertEquals(post.getId(), result.postId());
        assertNotNull(result.author());
    }

    @Test
    void shouldCreateComment() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter4"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("This is a great post!");

        CommentDTO result = commentService.create(post.getId(), author.getId(), dto);

        assertNotNull(result);
        assertNotNull(result.id());
        assertEquals("This is a great post!", result.content());
        assertEquals(post.getId(), result.postId());
    }

    @Test
    void shouldUpdateOwnComment() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter5"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Updated comment content.");

        CommentDTO result = commentService.update(saved.getId(), author.getId(), dto);

        assertNotNull(result);
        assertEquals("Updated comment content.", result.content());
    }

    @Test
    void shouldDeleteOwnComment() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter6"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        commentService.delete(saved.getId(), author.getId());

        assertFalse(commentRepository.findById(saved.getId()).isPresent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowNotFoundWhenCommentDoesNotExist() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> commentService.findById(randomId));
    }

    @Test
    void shouldThrowForbiddenWhenUpdatingAnotherUsersComment() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter7"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        UUID otherUserId = UUID.randomUUID();
        CommentRequestDTO dto = new CommentRequestDTO("Hacked comment.");

        assertThrows(ForbiddenException.class, () -> commentService.update(saved.getId(), otherUserId, dto));
    }

    @Test
    void shouldThrowForbiddenWhenDeletingAnotherUsersComment() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter8"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        UUID otherUserId = UUID.randomUUID();

        assertThrows(ForbiddenException.class, () -> commentService.delete(saved.getId(), otherUserId));
    }

    @Test
    void shouldThrowNotFoundWhenUpdatingNonExistentComment() {
        UUID randomId = UUID.randomUUID();
        CommentRequestDTO dto = new CommentRequestDTO("Ghost comment.");

        assertThrows(RecordNotFoundException.class, () -> commentService.update(randomId, randomId, dto));
    }

    @Test
    void shouldThrowNotFoundWhenDeletingNonExistentComment() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> commentService.delete(randomId, randomId));
    }

    @Test
    void shouldThrowBusinessExceptionWhenCreatingCommentAsSuspendedUser() {
        Profile suspended = profileRepository.save(TestDataFactory.createProfile(
                "suspended_commenter", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        Post post = postRepository.save(TestDataFactory.createPost(suspended.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Comment.");

        assertThrows(BusinessException.class, () -> commentService.create(post.getId(), suspended.getId(), dto));
    }

    @Test
    void shouldThrowBusinessExceptionWhenCreatingCommentAsBannedUser() {
        Profile banned = profileRepository.save(TestDataFactory.createProfile(
                "banned_commenter", Role.REGULAR, AccountStatus.BANNED, null));
        Post post = postRepository.save(TestDataFactory.createPost(banned.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Comment.");

        assertThrows(BusinessException.class, () -> commentService.create(post.getId(), banned.getId(), dto));
    }
}
