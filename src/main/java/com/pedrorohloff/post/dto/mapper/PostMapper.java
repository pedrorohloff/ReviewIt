package com.pedrorohloff.post.dto.mapper;

import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.enums.Status;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    public PostDTO toDTO(Post post) {
        if (post == null) {
            return null;
        }
        return new PostDTO(post.getId(), post.getTitle(), post.getContent());
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
        post.setContent(postDTO.content());
        post.setStatus(Status.ACTIVE);
        return post;
    }
}
