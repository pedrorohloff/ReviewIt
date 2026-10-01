package com.pedrorohloff.post.dto.mapper;

import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.dto.PostDTO;
import com.pedrorohloff.post.dto.PostRequestDTO;
import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.NotifyChannel;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class PostMapper {

    private ProfileMapper profileMapper;

    public PostMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public PostDTO toDTO(Post post, Profile author, long likeCount, long commentCount) {
        if (post == null || author == null) {
            return null;
        }
        return new PostDTO(
                post.getId(),
                profileMapper.toSummaryDTO(author),
                post.getTitle(),
                post.getContentType().getValue(),
                post.getGenre().getValue(),
                post.getContent(),
                post.isNotifyEnabled(),
                post.getNotifyChannel().getValue(),
                likeCount,
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public Post toModel(PostRequestDTO postRequestDTO, UUID authorId) {
        if (postRequestDTO == null) {
            return null;
        }
        // alterar para builder pattern posteriormente
        Post post = new Post();
        post.setAuthorId(authorId);
        post.setTitle(postRequestDTO.title());
        post.setContentType(convertContentTypeValue(postRequestDTO.contentType()));
        post.setGenre(convertGenreValue(postRequestDTO.genre()));
        post.setContent(postRequestDTO.content());
        post.setUpdatedAt(Instant.now());
        return post;
    }

    public ContentType convertContentTypeValue(String value) {
        return value == null ? null : ContentType.valueOf(value);
    }

    public Genre convertGenreValue(String value) {
        return value == null ? null : Genre.valueOf(value);
    }

    public NotifyChannel convertNotifyChannelValue(String value) {
        return value == null ? null : NotifyChannel.valueOf(value);
    }
}
