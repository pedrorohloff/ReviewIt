package com.pedrorohloff.comment.dto.mapper;

import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.dto.mapper.ProfileMapper;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class CommentMapper {

    private final ProfileMapper profileMapper;

    public CommentMapper(ProfileMapper profileMapper) {
        this.profileMapper = profileMapper;
    }

    public Comment toModel(CommentRequestDTO dto, UUID postId, UUID authorId) {
        if (dto == null) {
            return null;
        }
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setAuthorId(authorId);
        comment.setContent(dto.content());
        comment.setUpdatedAt(Instant.now());
        return comment;
    }

    public CommentDTO toDTO(Comment comment, Profile author, long likeCount) {
        if (comment == null) {
            return null;
        }
        return new CommentDTO(
                comment.getId(),
                comment.getPostId(),
                profileMapper.toSummaryDTO(author),
                comment.getContent(),
                likeCount,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
