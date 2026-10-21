package com.pedrorohloff.post;

import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
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

import java.util.List;
import java.util.UUID;

@Service
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final ProfileRepository profileRepository;
    private final PostMapper postMapper;

    public PostService(PostRepository postRepository,
                       ProfileRepository profileRepository,
                       PostMapper postMapper) {
        this.postRepository = postRepository;
        this.profileRepository = profileRepository;
        this.postMapper = postMapper;
    }

    @Transactional(readOnly = true)
    public PostPageDTO findAll(PostQuery query, int page, int pageSize) {
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

        var dtos = posts.stream()
                .map(post -> {
                    Profile author = profileRepository.findById(post.getAuthorId())
                            .orElse(null);
                    return postMapper.toDTO(post, author, 0, 0);
                })
                .toList();

        int totalPages = pageSize <= 0 ? 0 : (int) ((totalElements + pageSize - 1) / pageSize);
        boolean hasNext = page + 1 < totalPages;

        return new PostPageDTO(dtos, totalElements, totalPages, hasNext);
    }

    @Transactional(readOnly = true)
    public PostDTO findById(UUID id) {
        return postRepository.findById(id)
                .map(post -> {
                    Profile author = profileRepository.findById(post.getAuthorId())
                            .orElse(null);
                    return postMapper.toDTO(post, author, 0, 0);
                })
                .orElseThrow(() -> new RecordNotFoundException("Post", id));
    }

    @Transactional
    public PostDTO create(UUID authorId, PostRequestDTO postRequestDTO) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", authorId));

        checkAccountStatus(author);

        Post post = postMapper.toModel(postRequestDTO, authorId);
        Post saved = postRepository.save(post);
        return postMapper.toDTO(saved, author, 0, 0);
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

        return postMapper.toDTO(postRepository.save(post), author, 0, 0);
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

        Profile author = profileRepository.findById(post.getAuthorId())
                .orElseThrow(() -> new RecordNotFoundException("Profile", post.getAuthorId()));

        return postMapper.toDTO(postRepository.save(post), author, 0, 0);
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
