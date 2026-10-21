package com.pedrorohloff.comment;

import com.pedrorohloff.comment.dto.CommentDTO;
import com.pedrorohloff.comment.dto.CommentPageDTO;
import com.pedrorohloff.comment.dto.CommentRequestDTO;
import com.pedrorohloff.comment.dto.mapper.CommentMapper;
import com.pedrorohloff.exception.BusinessException;
import com.pedrorohloff.exception.ForbiddenException;
import com.pedrorohloff.exception.RecordNotFoundException;
import com.pedrorohloff.like.CommentLikeRepository;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.ProfileRepository;
import com.pedrorohloff.profile.enums.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Validated
public class CommentService {

    /** Oldest first, with the id as a tiebreaker so paging is deterministic. */
    private static final Sort COMMENT_ORDER = Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"));

    private final CommentRepository commentRepository;
    private final ProfileRepository profileRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final CommentMapper commentMapper;

    public CommentService(CommentRepository commentRepository,
                          ProfileRepository profileRepository,
                          CommentLikeRepository commentLikeRepository,
                          CommentMapper commentMapper) {
        this.commentRepository = commentRepository;
        this.profileRepository = profileRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.commentMapper = commentMapper;
    }

    @Transactional(readOnly = true)
    public CommentPageDTO findAllByPost(UUID postId, int page, int pageSize, UUID currentUserId) {
        Pageable pageable = PageRequest.of(page, pageSize, COMMENT_ORDER);
        Page<Comment> commentPage = commentRepository.findByPostId(postId, pageable);

        return new CommentPageDTO(
                toDTOs(commentPage.getContent(), currentUserId),
                commentPage.getTotalElements(),
                commentPage.getTotalPages(),
                commentPage.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public CommentDTO findById(UUID id, UUID currentUserId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RecordNotFoundException("Comment", id));

        return toDTOs(List.of(comment), currentUserId).get(0);
    }

    @Transactional
    public CommentDTO create(UUID postId, UUID authorId, CommentRequestDTO dto) {
        Profile author = profileRepository.findById(authorId)
                .orElseThrow(() -> new RecordNotFoundException("Profile", authorId));

        checkAccountStatus(author);

        Comment comment = commentMapper.toModel(dto, postId, authorId);
        Comment saved = commentRepository.save(comment);

        return commentMapper.toDTO(saved, author, 0, false);
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

        return toDTOs(List.of(saved), requesterId).get(0);
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

    /**
     * Maps comments to DTOs without N+1 queries: authors, like counts and the
     * current user's likes are each fetched in a single batched query.
     */
    private List<CommentDTO> toDTOs(List<Comment> comments, UUID currentUserId) {
        if (comments.isEmpty()) {
            return List.of();
        }

        List<UUID> commentIds = comments.stream().map(Comment::getId).toList();

        Map<UUID, Profile> authorsById = profileRepository
                .findAllById(comments.stream().map(Comment::getAuthorId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Profile::getId, profile -> profile));

        Map<UUID, Long> likeCounts = commentLikeRepository.countByCommentIdIn(commentIds).stream()
                .collect(Collectors.toMap(
                        CommentLikeRepository.CommentLikeCount::getCommentId,
                        CommentLikeRepository.CommentLikeCount::getTotal));

        Set<UUID> likedByMe = currentUserId == null
                ? Set.of()
                : new HashSet<>(commentLikeRepository.findLikedCommentIds(currentUserId, commentIds));

        return comments.stream()
                .map(comment -> commentMapper.toDTO(
                        comment,
                        authorsById.get(comment.getAuthorId()),
                        likeCounts.getOrDefault(comment.getId(), 0L),
                        likedByMe.contains(comment.getId())))
                .toList();
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
