package com.pedrorohloff.comment;

import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentPageDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.comment.dto.mapper.CommentMapper;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Service
@Validated
public class CommentService {

    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;
    private final CommentMapper commentMapper;

    public CommentService(CommentRepository commentRepository,
                          ProfileRepository profileRepository,
                          CommentMapper commentMapper) {
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
        this.commentMapper = commentMapper;
    }

    @Transactional(readOnly = true)
    public CommentPageDTO findAllByPost(UUID postId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<Comment> commentPage = commentRepository.findByPostId(postId, pageable);

        var comments = commentPage.getContent().stream()
                .map(comment -> {
                    Profile author = profileRepository.findById(comment.getAuthorId())
                            .orElse(null);
                    return commentMapper.toDTO(comment, author, 0);
                })
                .toList();

        return new CommentPageDTO(
                comments,
                commentPage.getTotalElements(),
                commentPage.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public CommentDTO findById(UUID id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Comment", id));

        Profile author = profileRepository.findById(comment.getAuthorId())
                .orElse(null);

        return commentMapper.toDTO(comment, author, 0);
    }

    @Transactional
    public CommentDTO create(UUID postId, UUID authorId, CommentRequestDTO dto) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", authorId));

        Comment comment = commentMapper.toModel(dto, postId, authorId);
        Comment saved = commentRepository.save(comment);

        return commentMapper.toDTO(saved, author, 0);
    }

    @Transactional
    public CommentDTO update(UUID id, UUID requesterId, CommentRequestDTO dto) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Comment", id));

        if (!comment.getAuthorId().equals(requesterId)) {
            throw new ForbiddenException("You are not the author of this comment");
        }

        comment.setContent(dto.content());
        Comment saved = commentRepository.save(comment);

        Profile author = profileRepository.findById(comment.getAuthorId())
                .orElse(null);

        return commentMapper.toDTO(saved, author, 0);
    }

    @Transactional
    public void delete(UUID id, UUID requesterId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Comment", id));

        if (!comment.getAuthorId().equals(requesterId)) {
            throw new ForbiddenException("You are not the author of this comment");
        }

        commentRepository.delete(comment);
    }
}
