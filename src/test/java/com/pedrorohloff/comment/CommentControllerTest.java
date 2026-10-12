package com.pedrorohloff.comment;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.PostRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;
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
class CommentControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldListCommentsForPost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter1"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        mockMvc.perform(get("/api/v1/posts/{postId}/comments", post.getId())
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void shouldFindCommentById() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter2"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        mockMvc.perform(get("/api/v1/comments/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("This is a test comment."));
    }

    @Test
    void shouldCreateComment() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter3"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("This is a great post!");

        mockMvc.perform(post("/api/v1/posts/{postId}/comments", post.getId())
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("This is a great post!"));
    }

    @Test
    void shouldUpdateOwnComment() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter4"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Updated comment content.");

        mockMvc.perform(put("/api/v1/comments/{id}", saved.getId())
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated comment content."));
    }

    @Test
    void shouldDeleteOwnComment() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter5"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        mockMvc.perform(delete("/api/v1/comments/{id}", saved.getId())
                        .requestAttr("currentUserId", author.getId()))
                .andExpect(status().isNoContent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn404WhenCommentNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/comments/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn403WhenUpdatingAnotherUsersComment() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter6"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Hacked comment.");

        mockMvc.perform(put("/api/v1/comments/{id}", saved.getId())
                        .requestAttr("currentUserId", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn403WhenDeletingAnotherUsersComment() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter7"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        Comment saved = commentRepository.save(TestDataFactory.createComment(post.getId(), author.getId()));

        mockMvc.perform(delete("/api/v1/comments/{id}", saved.getId())
                        .requestAttr("currentUserId", UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenCreatingCommentWithEmptyContent() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("commenter8"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("");

        mockMvc.perform(post("/api/v1/posts/{postId}/comments", post.getId())
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn409WhenCreatingCommentAsSuspendedUser() throws Exception {
        Profile suspended = profileRepository.save(TestDataFactory.createProfile(
                "suspended_commenter", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        Post post = postRepository.save(TestDataFactory.createPost(suspended.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Comment.");

        mockMvc.perform(post("/api/v1/posts/{postId}/comments", post.getId())
                        .requestAttr("currentUserId", suspended.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenCreatingCommentAsBannedUser() throws Exception {
        Profile banned = profileRepository.save(TestDataFactory.createProfile(
                "banned_commenter", Role.REGULAR, AccountStatus.BANNED, null));
        Post post = postRepository.save(TestDataFactory.createPost(banned.getId()));
        CommentRequestDTO dto = new CommentRequestDTO("Comment.");

        mockMvc.perform(post("/api/v1/posts/{postId}/comments", post.getId())
                        .requestAttr("currentUserId", banned.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }
}
