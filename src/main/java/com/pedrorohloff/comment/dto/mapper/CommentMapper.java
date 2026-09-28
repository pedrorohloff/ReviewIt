package com.pedrorohloff.comment.dto.mapper;

import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.comment.dto.CommentDTO;
import org.springframework.stereotype.Component;

@Component
public class CommentMapper {

    public CommentDTO toDTO(Comment comment) {
        if (comment == null) {
            return null;
        }
        return new CommentDTO(comment.getId(), comment.getPostId(), comment.getAuthorId(),comment.getContent());
    }

    public Comment toEntity(CommentDTO commentDTO) {
        if (commentDTO == null) {
            return null;
        }
        Comment comment = new Comment();
        if (commentDTO.id() != null) {
            comment.setId(commentDTO.id());
        }
        comment.setPostId(commentDTO.postId());
        comment.setAuthorId(commentDTO.authorId());
        comment.setContent(commentDTO.content());
        return comment;
    }

}
