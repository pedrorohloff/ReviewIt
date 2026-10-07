package com.pedrorohloff.like;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, UUID> {
    long countByPostId(UUID postId);
    Optional<PostLike> findByPostIdAndUserId(UUID postId, UUID userId);
}
