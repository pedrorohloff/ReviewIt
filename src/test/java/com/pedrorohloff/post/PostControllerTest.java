package com.pedrorohloff.post;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.post.dto.PostRequestDTO;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class PostControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ProfileRepository profileRepository;

    // ============ HAPPY PATH ============

    @Test
    void shouldListPosts() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster1"));
        postRepository.save(TestDataFactory.createPost(author.getId()));
        postRepository.save(TestDataFactory.createPost(author.getId()));

        mockMvc.perform(get("/api/v1/posts")
                        .param("page", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void shouldFindPostById() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster2"));
        Post saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        mockMvc.perform(get("/api/v1/posts/{id}", saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Post Title"));
    }

    @Test
    void shouldCreatePost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster3"));
        PostRequestDTO dto = new PostRequestDTO("My New Post", "Movie", "Comedy", "Great movie review content.");

        mockMvc.perform(post("/api/v1/posts")
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("My New Post"));
    }

    @Test
    void shouldUpdateOwnPost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster4"));
        Post saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        PostRequestDTO dto = new PostRequestDTO("Updated Title", "Book", "Drama", "Updated content.");

        mockMvc.perform(put("/api/v1/posts/{id}", saved.getId())
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    void shouldDeleteOwnPost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster5"));
        Post saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        mockMvc.perform(delete("/api/v1/posts/{id}", saved.getId())
                        .requestAttr("currentUserId", author.getId()))
                .andExpect(status().isNoContent());
    }

    // ============ BAD PATH ============

    @Test
    void shouldReturn404WhenPostNotFound() throws Exception {
        mockMvc.perform(get("/api/v1/posts/{id}", java.util.UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn403WhenUpdatingAnotherUsersPost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster6"));
        Post saved = postRepository.save(TestDataFactory.createPost(author.getId()));
        PostRequestDTO dto = new PostRequestDTO("Hacked", "Book", "Action", "Hacked content.");

        mockMvc.perform(put("/api/v1/posts/{id}", saved.getId())
                        .requestAttr("currentUserId", java.util.UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn403WhenDeletingAnotherUsersPost() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster7"));
        Post saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        mockMvc.perform(delete("/api/v1/posts/{id}", saved.getId())
                        .requestAttr("currentUserId", java.util.UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenCreatingPostWithInvalidData() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("poster8"));
        PostRequestDTO dto = new PostRequestDTO("Hi", "Book", "Action", "Short"); // title too short, content too short

        mockMvc.perform(post("/api/v1/posts")
                        .requestAttr("currentUserId", author.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn409WhenCreatingPostAsSuspendedUser() throws Exception {
        Profile suspended = profileRepository.save(TestDataFactory.createProfile(
                "suspended_poster", Role.REGULAR, AccountStatus.SUSPENDED, Instant.now().plusSeconds(3600)));
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        mockMvc.perform(post("/api/v1/posts")
                        .requestAttr("currentUserId", suspended.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenCreatingPostAsBannedUser() throws Exception {
        Profile banned = profileRepository.save(TestDataFactory.createProfile(
                "banned_poster", Role.REGULAR, AccountStatus.BANNED, null));
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "Content.");

        mockMvc.perform(post("/api/v1/posts")
                        .requestAttr("currentUserId", banned.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }
}
