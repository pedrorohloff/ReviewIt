package com.pedrorohloff.like;

import com.pedrorohloff.like.dto.ToggleLikeDTO;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class LikeService {
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;

    public LikeService(PostLikeRepository postLikeRepository, CommentLikeRepository commentLikeRepository) {
        this.postLikeRepository = postLikeRepository;
        this.commentLikeRepository = commentLikeRepository;
    }

    @Transactional
    public ToggleLikeDTO togglePostLike(UUID postId, UUID userId) {
        Optional<PostLike> existing = postLikeRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
            long count = postLikeRepository.countByPostId(postId);
            return new ToggleLikeDTO(false, count);
        }
        else {
            PostLike like = new PostLike(postId, userId);
            postLikeRepository.save(like);
            long count = postLikeRepository.countByPostId(postId);
            return new ToggleLikeDTO(true, count);
        }
    }

    @Transactional
    public ToggleLikeDTO toggleCommentLike(UUID commentId, UUID userId) {
        Optional<CommentLike> existing = commentLikeRepository.findByCommentIdAndUserId(commentId, userId);
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
            long count = commentLikeRepository.countByCommentId(commentId);
            return new ToggleLikeDTO(false, count);
        }
        else {
            CommentLike like = new CommentLike(commentId, userId);
            commentLikeRepository.save(like);
            long count = commentLikeRepository.countByCommentId(commentId);
            return new ToggleLikeDTO(true, count);
        }
    }

}
