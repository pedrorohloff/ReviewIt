package com.pedrorohloff.post;

import com.pedrorohloff.comment.CommentRepository;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.like.PostLikeRepository;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostPageDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.dto.UpdateNotificationSettingsRequestDTO;
import com.pedrorohloff.post.dto.mapper.PostMapper;
import com.pedrorohloff.post.enums.PostSort;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;
    private final PostMapper postMapper;

    public PostService(PostRepository postRepository,
                       PostLikeRepository postLikeRepository,
                       CommentRepository commentRepository,
                       ProfileRepository profileRepository,
                       PostMapper postMapper) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
        this.postMapper = postMapper;
    }

    @Transactional(readOnly = true)
    public PostPageDTO findAll(PostQuery query, int page, int pageSize, UUID currentUserId) {
        Specification<Post> specification = PostSpecifications.withFilter(query);
        Pageable pageable = PageRequest.of(page, pageSize);

        List<Post> posts;
        long totalElements;

        if (query.sort() == PostSort.POPULAR) {
            posts = postRepository.findPopular(
                    PostSpecifications.likePattern(query.q()),
                    query.contentType(),
                    query.genre(),
                    query.authorId(),
                    pageable);
            totalElements = postRepository.count(specification);
        } else {
            Pageable recentPageable = PageRequest.of(page, pageSize,
                    Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
            Page<Post> postPage = postRepository.findAll(specification, recentPageable);
            posts = postPage.getContent();
            totalElements = postPage.getTotalElements();
        }

        int totalPages = pageSize <= 0 ? 0 : (int) ((totalElements + pageSize - 1) / pageSize);
        boolean hasNext = page + 1 < totalPages;

        return new PostPageDTO(toDTOs(posts, currentUserId), totalElements, totalPages, hasNext);
    }

    @Transactional(readOnly = true)
    public PostDTO findById(UUID id, UUID currentUserId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Post", id));
        return toDTOs(List.of(post), currentUserId).get(0);
    }

    @Transactional
    public PostDTO create(UUID authorId, PostRequestDTO postRequestDTO) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", authorId));

        checkAccountStatus(author);

        Post post = postMapper.toModel(postRequestDTO, authorId);
        Post saved = postRepository.save(post);
        return toDTOs(List.of(saved), authorId).get(0);
    }

    @Transactional
    public PostDTO update(UUID id, UUID requesterId, PostRequestDTO postRequestDTO) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Post", id));

        if (!post.getAuthorId().equals(requesterId)) {
            throw new ForbiddenException("You are not the author of this post");
        }

        Profile author = profileRepository.findById(post.getAuthorId())
                .orElseThrow(() -> new RecordNotFoundException("Profile", post.getAuthorId()));

        checkAccountStatus(author);

        post.setTitle(postRequestDTO.title());
        post.setContentType(postMapper.convertContentTypeValue(postRequestDTO.contentType()));
        post.setGenre(postMapper.convertGenreValue(postRequestDTO.genre()));
        post.setContent(postRequestDTO.content());

        return toDTOs(List.of(postRepository.save(post)), requesterId).get(0);
    }

    @Transactional
    public void delete(UUID id, UUID requesterId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Post", id));

        if (!post.getAuthorId().equals(requesterId)) {
            throw new ForbiddenException("You are not the author of this post");
        }

        postRepository.delete(post);
    }

    @Transactional
    public PostDTO updateNotificationSettings(UUID id, UUID requesterId, UpdateNotificationSettingsRequestDTO dto) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Post", id));

        if (!post.getAuthorId().equals(requesterId)) {
            throw new ForbiddenException("You are not the author of this post");
        }

        post.setNotifyEnabled(dto.notifyEnabled());
        post.setNotifyChannel(postMapper.convertNotifyChannelValue(dto.notifyChannel()));

        return toDTOs(List.of(postRepository.save(post)), requesterId).get(0);
    }

    /**
     * Maps a page of posts to DTOs without N+1 queries: authors, like counts,
     * comment counts and the current user's likes are each fetched in a single
     * batched query and merged in memory.
     */
    private List<PostDTO> toDTOs(List<Post> posts, UUID currentUserId) {
        if (posts.isEmpty()) {
            return List.of();
        }

        List<UUID> postIds = posts.stream().map(Post::getId).toList();

        Map<UUID, Profile> authorsById = profileRepository
                .findAllById(posts.stream().map(Post::getAuthorId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Profile::getId, profile -> profile));

        Map<UUID, Long> likeCounts = postLikeRepository.countByPostIdIn(postIds).stream()
                .collect(Collectors.toMap(
                        PostLikeRepository.PostLikeCount::getPostId,
                        PostLikeRepository.PostLikeCount::getTotal));

        Map<UUID, Long> commentCounts = commentRepository.countByPostIdIn(postIds).stream()
                .collect(Collectors.toMap(
                        CommentRepository.CommentCount::getPostId,
                        CommentRepository.CommentCount::getTotal));

        Set<UUID> likedByMe = currentUserId == null
                ? Set.of()
                : new HashSet<>(postLikeRepository.findLikedPostIds(currentUserId, postIds));

        return posts.stream()
                .map(post -> postMapper.toDTO(
                        post,
                        authorsById.get(post.getAuthorId()),
                        likeCounts.getOrDefault(post.getId(), 0L),
                        commentCounts.getOrDefault(post.getId(), 0L),
                        likedByMe.contains(post.getId())))
                .toList();
    }

    private void checkAccountStatus(Profile author) {
        if (author.getAccountStatus() == AccountStatus.SUSPENDED) {
            throw new BusinessException("Account is suspended");
        }
        if (author.getAccountStatus() == AccountStatus.BANNED) {
            throw new BusinessException("Account is banned");
        }
    }
}
