package com.pedrorohloff.like;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class LikeControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldLikePost() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user1"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));

        mockMvc.perform(post("/api/v1/posts/{postId}/like", post.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void shouldUnlikePost() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user2"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));

        mockMvc.perform(post("/api/v1/posts/{postId}/like", post.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/posts/{postId}/like", post.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false))
                .andExpect(jsonPath("$.likeCount").value(0));
    }

    @Test
    void shouldLikeComment() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user3"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Comment comment = commentRepository.save(TestDataFactory.createComment(post.getId(), user.getId()));

        mockMvc.perform(post("/api/v1/comments/{commentId}/like", comment.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    void shouldUnlikeComment() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user4"));
        Post post = postRepository.save(TestDataFactory.createPost(user.getId()));
        Comment comment = commentRepository.save(TestDataFactory.createComment(post.getId(), user.getId()));

        mockMvc.perform(post("/api/v1/comments/{commentId}/like", comment.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/comments/{commentId}/like", comment.getId())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false))
                .andExpect(jsonPath("$.likeCount").value(0));
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn404WhenLikingNonExistentPost() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user5"));

        mockMvc.perform(post("/api/v1/posts/{postId}/like", UUID.randomUUID())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn404WhenLikingNonExistentComment() throws Exception {
        Profile user = profileRepository.save(TestDataFactory.createProfile("like_user6"));

        mockMvc.perform(post("/api/v1/comments/{commentId}/like", UUID.randomUUID())
                        .requestAttr("currentUserId", user.getId()))
                .andExpect(status().isOk());
    }
}
