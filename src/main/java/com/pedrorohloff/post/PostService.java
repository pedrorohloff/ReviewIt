package com.pedrorohloff.post;

import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.dto.mapper.PostMapper;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
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

    public List<PostDTO> list() {
        return postRepository.findAll().stream()
                .map(post -> {
                    Profile author = profileRepository.findById(post.getAuthorId())
                            .orElse(null);
                    return postMapper.toDTO(post, author, 0, 0);
                })
                .toList();
    }

    public PostDTO findById(@NotNull UUID id) {
        return postRepository.findById(id)
                .map(post -> {
                    Profile author = profileRepository.findById(post.getAuthorId())
                            .orElse(null);
                    return postMapper.toDTO(post, author, 0, 0);
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public PostDTO create(@NotNull UUID authorId, @Valid @NotNull PostRequestDTO postRequestDTO) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException(authorId));
        Post post = postMapper.toModel(postRequestDTO, authorId);
        Post saved = postRepository.save(post);
        return postMapper.toDTO(saved, author, 0, 0);
    }

    public PostDTO update(@NotNull UUID id, @NotNull UUID requesterId, @Valid @NotNull PostRequestDTO postRequestDTO) {
        return postRepository.findById(id)
                .map(recordFound -> {
                    if (!recordFound.getAuthorId().equals(requesterId)) {
                        throw new com.pedrorohloff.exception.BusinessException("User is not the author of this post");
                    }
                    recordFound.setTitle(postRequestDTO.title());
                    recordFound.setContentType(postMapper.convertContentTypeValue(postRequestDTO.contentType()));
                    recordFound.setGenre(postMapper.convertGenreValue(postRequestDTO.genre()));
                    recordFound.setContent(postRequestDTO.content());
                    Profile author = profileRepository.findById(recordFound.getAuthorId())
                            .orElse(null);
                    return postMapper.toDTO(postRepository.save(recordFound), author, 0, 0);
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public void delete(@NotNull UUID id, @NotNull UUID requesterId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));
        if (!post.getAuthorId().equals(requesterId)) {
            throw new com.pedrorohloff.exception.BusinessException("User is not the author of this post");
        }
        postRepository.delete(post);
    }
}
