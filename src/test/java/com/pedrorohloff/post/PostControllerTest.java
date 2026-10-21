package com.pedrorohloff.post;

import tools.jackson.databind.ObjectMapper;
import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.like.PostLikeRepository;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
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

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

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

    // ============ FEED QUERY ============

    @Test
    void shouldFilterPostsByQueryParams() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("ctrl_filter_author"));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Book Review", ContentType.BOOK, Genre.ACTION));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Movie Review", ContentType.MOVIE, Genre.ROMANCE));

        mockMvc.perform(get("/api/v1/posts")
                        .param("contentType", "Movie")
                        .param("genre", "Romance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].contentType").value("Movie"))
                .andExpect(jsonPath("$.content[0].genre").value("Romance"));
    }

    @Test
    void shouldSearchPostsByQuery() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("ctrl_search_author"));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Unique Searchable Title"));

        mockMvc.perform(get("/api/v1/posts").param("q", "searchable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void shouldSortPostsByPopularity() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("ctrl_popular_author"));
        Profile liker = profileRepository.save(TestDataFactory.createProfile("ctrl_popular_liker"));
        var lessLiked = postRepository.save(TestDataFactory.createPost(author.getId(), "Less Liked"));
        var mostLiked = postRepository.save(TestDataFactory.createPost(author.getId(), "Most Liked"));
        postLikeRepository.save(TestDataFactory.createPostLike(mostLiked.getId(), liker.getId()));

        mockMvc.perform(get("/api/v1/posts").param("sort", "popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(mostLiked.getId().toString()))
                .andExpect(jsonPath("$.content[1].id").value(lessLiked.getId().toString()));
    }

    @Test
    void shouldReturnRealCountsInTheFeed() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("ctrl_counts_author"));
        Profile liker = profileRepository.save(TestDataFactory.createProfile("ctrl_counts_liker"));
        var post = postRepository.save(TestDataFactory.createPost(author.getId(), "Counted Post"));
        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), liker.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), liker.getId()));

        mockMvc.perform(get("/api/v1/posts").param("q", "Counted Post"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].likeCount").value(1))
                .andExpect(jsonPath("$.content[0].commentCount").value(1));
    }

    @Test
    void shouldReturnLikedByMeForCurrentUser() throws Exception {
        Profile author = profileRepository.save(TestDataFactory.createProfile("ctrl_liked_author"));
        Profile liker = profileRepository.save(TestDataFactory.createProfile("ctrl_liked_liker"));
        var post = postRepository.save(TestDataFactory.createPost(author.getId(), "Liked By Me Post"));
        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), liker.getId()));

        mockMvc.perform(get("/api/v1/posts/{id}", post.getId())
                        .requestAttr("currentUserId", liker.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likedByMe").value(true));

        mockMvc.perform(get("/api/v1/posts/{id}", post.getId())
                        .requestAttr("currentUserId", author.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likedByMe").value(false));
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
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "This is test content for validation rules.");

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
        PostRequestDTO dto = new PostRequestDTO("Title", "Book", "Action", "This is test content for validation rules.");

        mockMvc.perform(post("/api/v1/posts")
                        .requestAttr("currentUserId", banned.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn400WhenContentTypeIsInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/posts").param("contentType", "Sandwich"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenGenreIsInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/posts").param("genre", "Sandwich"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenSortIsInvalid() throws Exception {
        mockMvc.perform(get("/api/v1/posts").param("sort", "chaos"))
                .andExpect(status().isBadRequest());
    }
}
