package com.pedrorohloff.like;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    long countByCommentId(UUID commentId);
    Optional<CommentLike> findByCommentIdAndUserId(UUID commentId, UUID userId);
}
