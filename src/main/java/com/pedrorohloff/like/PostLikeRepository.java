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
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
    long countByPostId(UUID postId);
    Optional<PostLike> findByPostIdAndUserId(UUID postId, UUID userId);

    @Query("""
            SELECT l.postId AS postId, COUNT(l) AS total
            FROM PostLike l
            WHERE l.postId IN :postIds
            GROUP BY l.postId
            """)
    List<PostLikeCount> countByPostIdIn(@Param("postIds") Collection<UUID> postIds);

    @Query("SELECT l.postId FROM PostLike l WHERE l.userId = :userId AND l.postId IN :postIds")
    List<UUID> findLikedPostIds(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);

    interface PostLikeCount {
        UUID getPostId();

        long getTotal();
    }
}
