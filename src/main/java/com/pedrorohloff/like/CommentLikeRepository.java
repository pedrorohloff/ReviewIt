package com.pedrorohloff.like;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {
    long countByCommentId(UUID commentId);
    Optional<CommentLike> findByCommentIdAndUserId(UUID commentId, UUID userId);

    @Query("""
            SELECT l.commentId AS commentId, COUNT(l) AS total
            FROM CommentLike l
            WHERE l.commentId IN :commentIds
            GROUP BY l.commentId
            """)
    List<CommentLikeCount> countByCommentIdIn(@Param("commentIds") Collection<UUID> commentIds);

    @Query("SELECT l.commentId FROM CommentLike l WHERE l.userId = :userId AND l.commentId IN :commentIds")
    List<UUID> findLikedCommentIds(@Param("userId") UUID userId, @Param("commentIds") Collection<UUID> commentIds);

    interface CommentLikeCount {
        UUID getCommentId();

        long getTotal();
    }
}
