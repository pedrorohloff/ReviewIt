package com.pedrorohloff.like;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.like.dto.ToggleLikeDTO;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class LikeServiceTest extends AbstractIntegrationTest {

    @Autowired
    private LikeService likeService;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldLikePostWhenNotAlreadyLiked() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker1"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));

        ToggleLikeDTO result = likeService.togglePostLike(post.getId(), user.getId());

        assertNotNull(result);
        assertTrue(result.liked());
        assertEquals(1, result.likeCount());
    }

    @Test
    void shouldUnlikePostWhenAlreadyLiked() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker2"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), user.getId()));

        ToggleLikeDTO result = likeService.togglePostLike(post.getId(), user.getId());

        assertNotNull(result);
        assertFalse(result.liked());
        assertEquals(0, result.likeCount());
    }

    @Test
    void shouldLikeCommentWhenNotAlreadyLiked() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker3"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Comment comment = commentRepository.save(TestDataFactory.createComment(post.getId(), user.getId()));

        ToggleLikeDTO result = likeService.toggleCommentLike(comment.getId(), user.getId());

        assertNotNull(result);
        assertTrue(result.liked());
        assertEquals(1, result.likeCount());
    }

    @Test
    void shouldUnlikeCommentWhenAlreadyLiked() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker4"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Comment comment = commentRepository.save(TestDataFactory.createComment(post.getId(), user.getId()));
        commentLikeRepository.save(TestDataFactory.createCommentLike(comment.getId(), user.getId()));

        ToggleLikeDTO result = likeService.toggleCommentLike(comment.getId(), user.getId());

        assertNotNull(result);
        assertFalse(result.liked());
        assertEquals(0, result.likeCount());
    }

    @Test
    void shouldTrackMultipleLikesOnSamePost() {
        Profile user1 = profileRepository.save(TestDataFactory.createProfile("liker5"));
        Profile user2 = profileRepository.save(TestDataFactory.createProfile("liker6"));
        Post post = postRepository.save(TestDataFactory.createPost(user1.getId()));

        likeService.togglePostLike(post.getId(), user1.getId());
        ToggleLikeDTO result = likeService.togglePostLike(post.getId(), user2.getId());

        assertNotNull(result);
        assertTrue(result.liked());
        assertEquals(2, result.likeCount());
    }

    // ============ BAD PATH ============

    @Test
    void shouldHandleLikeOnNonExistentPost() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker7"));
        UUID randomPostId = UUID.randomUUID();

        ToggleLikeDTO result = likeService.togglePostLike(randomPostId, user.getId());

        assertNotNull(result);
        assertTrue(result.liked());
        assertEquals(1, result.likeCount());
    }

    @Test
    void shouldHandleLikeOnNonExistentComment() {
        Profile user = profileRepository.save(TestDataFactory.createProfile("liker8"));
        UUID randomCommentId = UUID.randomUUID();

        ToggleLikeDTO result = likeService.toggleCommentLike(randomCommentId, user.getId());

        assertNotNull(result);
        assertTrue(result.liked());
        assertEquals(1, result.likeCount());
    }
}
