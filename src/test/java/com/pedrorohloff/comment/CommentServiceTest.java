package com.pedrorohloff.comment;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentPageDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.like.CommentLikeRepository;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.List;
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

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldReturnPaginatedListOfCommentsForPost() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter1"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        CommentPageDTO result = commentService.findAllByPost(post.getId(), 0, 10, null);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoCommentsExist() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter2"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));

        CommentPageDTO result = commentService.findAllByPost(post.getId(), 0, 10, null);

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

        CommentDTO result = commentService.findById(saved.getId(), null);

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
    void shouldReturnRealLikeCountsAndViewerLikes() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter_likes"));
        Profile viewer = profileRepository.save(TestDataFactory.createProfile("commenter_viewer"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment liked = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        Comment notLiked = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        commentLikeRepository.save(TestDataFactory.createCommentLike(liked.getId(), viewer.getId()));
        commentLikeRepository.save(TestDataFactory.createCommentLike(liked.getId(), author.getId()));

        CommentPageDTO page = commentService.findAllByPost(post.getId(), 0, 10, viewer.getId());

        CommentDTO likedDTO = page.comments().stream()
                .filter(comment -> comment.id().equals(liked.getId()))
                .findFirst()
                .orElseThrow();
        CommentDTO notLikedDTO = page.comments().stream()
                .filter(comment -> comment.id().equals(notLiked.getId()))
                .findFirst()
                .orElseThrow();

        assertEquals(2, likedDTO.likeCount());
        assertTrue(likedDTO.likedByMe());
        assertEquals(0, notLikedDTO.likeCount());
        assertFalse(notLikedDTO.likedByMe());
    }

    @Test
    void shouldNotMarkCommentsLikedForAnonymousViewer() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter_anon"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment comment = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        commentLikeRepository.save(TestDataFactory.createCommentLike(comment.getId(), author.getId()));

        CommentDTO result = commentService.findById(comment.getId(), null);

        assertEquals(1, result.likeCount());
        assertFalse(result.likedByMe());
    }

    @Test
    void shouldReturnCommentsInStableChronologicalOrder() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter_order"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));

        Comment third = TestDataFactory.createComment(post.getId(), author.getId(), "Third");
        third.setCreatedAt(Instant.parse("2026-01-03T10:00:00Z"));
        Comment first = TestDataFactory.createComment(post.getId(), author.getId(), "First");
        first.setCreatedAt(Instant.parse("2026-01-01T10:00:00Z"));
        Comment second = TestDataFactory.createComment(post.getId(), author.getId(), "Second");
        second.setCreatedAt(Instant.parse("2026-01-02T10:00:00Z"));
        commentRepository.save(third);
        commentRepository.save(first);
        commentRepository.save(second);

        CommentPageDTO page = commentService.findAllByPost(post.getId(), 0, 10, null);

        assertEquals(List.of("First", "Second", "Third"),
                page.comments().stream().map(CommentDTO::content).toList());
    }

    @Test
    void shouldPageCommentsWithHasNext() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter_paging"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        for (int index = 0; index < 3; index++) {
            Comment comment = TestDataFactory.createComment(post.getId(), author.getId(), "Comment " + index);
            comment.setCreatedAt(Instant.parse("2026-02-0" + (index + 1) + "T10:00:00Z"));
            commentRepository.save(comment);
        }

        CommentPageDTO firstPage = commentService.findAllByPost(post.getId(), 0, 2, null);
        CommentPageDTO secondPage = commentService.findAllByPost(post.getId(), 1, 2, null);

        assertEquals(2, firstPage.comments().size());
        assertTrue(firstPage.hasNext());
        assertEquals(3, firstPage.totalElements());
        assertEquals(1, secondPage.comments().size());
        assertFalse(secondPage.hasNext());
        assertEquals("Comment 2", secondPage.comments().get(0).content());
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

        assertThrows(RecordNotFoundException.class, () -> commentService.findById(randomId, null));
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
