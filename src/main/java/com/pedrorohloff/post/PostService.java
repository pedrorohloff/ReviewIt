package com.pedrorohloff.post;

import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.mapper.PostMapper;
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
    private final PostMapper postMapper;

    public PostService(PostRepository postRepository, PostMapper postMapper) {
        this.postRepository = postRepository;
        this.postMapper = postMapper;
    }

    public List<PostDTO> list() {
        return postRepository.findAll().stream()
                .map(postMapper::toDTO)
                .toList();
    }

    public PostDTO findById(@NotNull UUID id) {
        return postRepository.findById(id).map(postMapper::toDTO)
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public PostDTO create(@Valid @NotNull PostDTO post) {
        return postMapper.toDTO(postRepository.save(postMapper.toEntity(post)));
    }

    public PostDTO update(@NotNull UUID id, @Valid @NotNull PostDTO postDTO) {
        return postRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setContent(postDTO.content());
                    recordFound.setTitle(postDTO.title());
                    recordFound.setGenre(postMapper.convertGenreValue(postDTO.genre()));
                    return postMapper.toDTO(postRepository.save(recordFound));
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }
    
    public void delete(@NotNull UUID id) {
        postRepository.delete(postRepository.findById(id)
                        .orElseThrow(() -> new RecordNotFoundException(id))
        );
    }
}
