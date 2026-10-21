package com.pedrorohloff.post;

import com.pedrorohloff.AbstractIntegrationTest;
import com.pedrorohloff.TestDataFactory;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.like.PostLikeRepository;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostPageDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.PostSort;
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

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

    private PostQuery recentQuery() {
        return new PostQuery(null, null, null, null, PostSort.RECENT);
    }

    // ============ HAPPY PATH ============

    @Test
    void shouldReturnPaginatedListOfPosts() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author1"));
        postRepository.save(TestDataFactory.createPost(author.getId()));
        postRepository.save(TestDataFactory.createPost(author.getId()));

        PostPageDTO result = postService.findAll(recentQuery(), 0, 10, null);

        assertNotNull(result);
        assertTrue(result.totalElements() >= 2);
        assertFalse(result.hasNext());
    }

    @Test
    void shouldReturnEmptyPageWhenNoPostsExist() {
        PostPageDTO result = postService.findAll(recentQuery(), 0, 10, null);

        assertNotNull(result);
        assertEquals(0, result.totalElements());
        assertEquals(0, result.totalPages());
        assertFalse(result.hasNext());
    }

    @Test
    void shouldFindPostById() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("author2"));
        var saved = postRepository.save(TestDataFactory.createPost(author.getId()));

        PostDTO result = postService.findById(saved.getId(), null);

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

    // ============ FEED QUERY ============

    @Test
    void shouldFilterPostsByContentType() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("filter_type_author"));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Book Review", ContentType.BOOK, Genre.ACTION));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Movie Review", ContentType.MOVIE, Genre.ACTION));

        PostPageDTO result = postService.findAll(
                new PostQuery(null, ContentType.MOVIE, null, null, null), 0, 10, null);

        assertEquals(1, result.totalElements());
        assertEquals("Movie", result.content().get(0).contentType());
    }

    @Test
    void shouldFilterPostsByGenre() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("filter_genre_author"));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Romance Tale", ContentType.BOOK, Genre.ROMANCE));
        postRepository.save(TestDataFactory.createPost(author.getId(), "Scary Tale", ContentType.BOOK, Genre.HORROR));

        PostPageDTO result = postService.findAll(
                new PostQuery(null, null, Genre.ROMANCE, null, null), 0, 10, null);

        assertEquals(1, result.totalElements());
        assertEquals("Romance", result.content().get(0).genre());
    }

    @Test
    void shouldFilterPostsByAuthor() {
        Profile authorOne = profileRepository.save(TestDataFactory.createProfile("filter_author_one"));
        Profile authorTwo = profileRepository.save(TestDataFactory.createProfile("filter_author_two"));
        postRepository.save(TestDataFactory.createPost(authorOne.getId(), "First Author Post"));
        postRepository.save(TestDataFactory.createPost(authorTwo.getId(), "Second Author Post"));

        PostPageDTO result = postService.findAll(
                new PostQuery(null, null, null, authorOne.getId(), null), 0, 10, null);

        assertEquals(1, result.totalElements());
        assertEquals(authorOne.getId(), result.content().get(0).author().id());
    }

    @Test
    void shouldSearchPostsByTitleOrContentIgnoringCase() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("search_author"));
        postRepository.save(TestDataFactory.createPost(
                author.getId(), "Hidden Treasure", ContentType.BOOK, Genre.ACTION));
        Post other = TestDataFactory.createPost(author.getId(), "Plain Title", ContentType.BOOK, Genre.ACTION);
        other.setContent("A story about Chrono Trigger and time travel.");
        postRepository.save(other);

        PostPageDTO byTitle = postService.findAll(
                new PostQuery("treasure", null, null, null, null), 0, 10, null);
        assertEquals(1, byTitle.totalElements());

        PostPageDTO byContent = postService.findAll(
                new PostQuery("CHRONO", null, null, null, null), 0, 10, null);
        assertEquals(1, byContent.totalElements());
        assertEquals(other.getId(), byContent.content().get(0).id());
    }

    @Test
    void shouldOrderPopularPostsByLikeCount() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("popular_author"));
        Profile likerOne = profileRepository.save(TestDataFactory.createProfile("popular_liker_one"));
        Profile likerTwo = profileRepository.save(TestDataFactory.createProfile("popular_liker_two"));
        Profile likerThree = profileRepository.save(TestDataFactory.createProfile("popular_liker_three"));

        Post lessLiked = postRepository.save(TestDataFactory.createPost(
                author.getId(), "Less Liked", ContentType.BOOK, Genre.ACTION));
        Post mostLiked = postRepository.save(TestDataFactory.createPost(
                author.getId(), "Most Liked", ContentType.BOOK, Genre.ACTION));

        postLikeRepository.save(TestDataFactory.createPostLike(mostLiked.getId(), likerOne.getId()));
        postLikeRepository.save(TestDataFactory.createPostLike(mostLiked.getId(), likerTwo.getId()));
        postLikeRepository.save(TestDataFactory.createPostLike(lessLiked.getId(), likerThree.getId()));

        PostPageDTO result = postService.findAll(
                new PostQuery(null, null, null, null, PostSort.POPULAR), 0, 10, null);

        assertEquals(2, result.totalElements());
        assertEquals(mostLiked.getId(), result.content().get(0).id());
        assertEquals(lessLiked.getId(), result.content().get(1).id());
    }

    @Test
    void shouldCombineFiltersAndSort() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("combined_author"));
        Post movie = postRepository.save(TestDataFactory.createPost(
                author.getId(), "Combined Movie", ContentType.MOVIE, Genre.DRAMA));
        postRepository.save(TestDataFactory.createPost(
                author.getId(), "Combined Book", ContentType.BOOK, Genre.DRAMA));

        PostPageDTO result = postService.findAll(
                new PostQuery(null, ContentType.MOVIE, Genre.DRAMA, author.getId(), PostSort.POPULAR), 0, 10, null);

        assertEquals(1, result.totalElements());
        assertEquals(movie.getId(), result.content().get(0).id());
    }

    @Test
    void shouldReturnRealLikeAndCommentCounts() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("counts_author"));
        Profile liker = profileRepository.save(TestDataFactory.createProfile("counts_liker"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId(), "Counted Post"));

        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), liker.getId()));
        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), author.getId()));
        commentRepository.save(TestDataFactory.createComment(post.getId(), liker.getId()));

        PostPageDTO result = postService.findAll(recentQuery(), 0, 10, null);
        PostDTO dto = result.content().stream()
                .filter(item -> item.id().equals(post.getId()))
                .findFirst()
                .orElseThrow();

        assertEquals(2, dto.likeCount());
        assertEquals(1, dto.commentCount());
    }

    @Test
    void shouldMarkLikedByMeOnlyForTheCurrentUser() {
        Profile author = profileRepository.save(TestDataFactory.createProfile("liked_author"));
        Profile liker = profileRepository.save(TestDataFactory.createProfile("liked_liker"));
        Profile other = profileRepository.save(TestDataFactory.createProfile("liked_other"));
        Post post = postRepository.save(TestDataFactory.createPost(author.getId(), "Liked Post"));
        postLikeRepository.save(TestDataFactory.createPostLike(post.getId(), liker.getId()));

        PostDTO forLiker = postService.findById(post.getId(), liker.getId());
        PostDTO forOther = postService.findById(post.getId(), other.getId());
        PostDTO forAnonymous = postService.findById(post.getId(), null);

        assertTrue(forLiker.likedByMe());
        assertFalse(forOther.likedByMe());
        assertFalse(forAnonymous.likedByMe());
    }

    // ============ BAD PATH ============

    @Test
    void shouldThrowNotFoundWhenPostDoesNotExist() {
        UUID randomId = UUID.randomUUID();

        assertThrows(RecordNotFoundException.class, () -> postService.findById(randomId, null));
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
