package com.pedrorohloff.post;

import com.pedrorohloff.exception.RecordNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Validated
public class PostService {
    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public List<Post> list() {
        return postRepository.findAll();
    }

    public Post findById(@NotNull UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public Post create(@Valid Post post) {
        return postRepository.save(post);
    }

    public Post update(@NotNull UUID id, @Valid Post post) {
        return postRepository.findById(id)
                .map(recordFound -> {
                    recordFound.setContent(post.getContent());
                    recordFound.setTitle(post.getTitle());
                    recordFound.setStatus(post.getStatus());
                    return postRepository.save(recordFound);
                })
                .orElseThrow(() -> new RecordNotFoundException(id));
    }

    public void delete(@NotNull UUID id) {
        postRepository.delete(
                postRepository
                        .findById(id)
                        .orElseThrow(() -> new RecordNotFoundException(id))
        );
    }
}
