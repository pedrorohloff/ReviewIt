package com.pedrorohloff.post.dto.mapper;

import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.Status;
import org.springframework.stereotype.Component;

import java.util.stream.Stream;

@Component
public class PostMapper {

    public PostDTO toDTO(Post post) {
        if (post == null) {
            return null;
        }
        return new PostDTO(post.getId(), post.getTitle(), post.getGenre().getValue(), post.getContent());
    }

    public Post toEntity(PostDTO postDTO) {
        if (postDTO == null) {
            return null;
        }
        // alterar para builder pattern posteriormente
        Post post = new Post();
        if (postDTO.id() != null) {
            post.setId(postDTO.id());
        }
        post.setTitle(postDTO.title());
        post.setGenre(convertGenreValue(postDTO.genre()));
        post.setContent(postDTO.content());
        post.setStatus(Status.ACTIVE);
        return post;
    }

    // refatorar depois
    public Genre convertGenreValue(String value) {
        if (value == null) {
            return null;
        }
        return Stream.of(Genre.values())
                .filter(s -> s.getValue().equals(value))
                .findFirst()
                .orElseThrow(IllegalArgumentException::new);
    }
}
