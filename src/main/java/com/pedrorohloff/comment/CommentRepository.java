package com.pedrorohloff.comment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostId(UUID postId, Pageable pageable);

    @Query("""
            SELECT c.postId AS postId, COUNT(c) AS total
            FROM Comment c
            WHERE c.postId IN :postIds
            GROUP BY c.postId
            """)
    List<CommentCount> countByPostIdIn(@Param("postIds") Collection<UUID> postIds);

    interface CommentCount {
        UUID getPostId();

        long getTotal();
    }
}
