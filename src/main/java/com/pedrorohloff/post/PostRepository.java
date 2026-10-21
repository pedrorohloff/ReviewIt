package com.pedrorohloff.post;

import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID>, JpaSpecificationExecutor<Post> {

    /**
     * Popular feed: posts joined with their likes and ordered by like count.
     * The join and {@code group by} are required because the like count is not
     * a column on {@code posts}. Filters mirror {@link PostSpecifications}.
     */
    @Query("""
            SELECT p FROM Post p
            LEFT JOIN PostLike l ON l.postId = p.id
            WHERE (:pattern IS NULL
                   OR LOWER(p.title) LIKE :pattern ESCAPE '\\'
                   OR LOWER(p.content) LIKE :pattern ESCAPE '\\')
              AND (:contentType IS NULL OR p.contentType = :contentType)
              AND (:genre IS NULL OR p.genre = :genre)
              AND (:authorId IS NULL OR p.authorId = :authorId)
            GROUP BY p
            ORDER BY COUNT(l) DESC, p.createdAt DESC, p.id DESC
            """)
    List<Post> findPopular(@Param("pattern") String pattern,
                           @Param("contentType") ContentType contentType,
                           @Param("genre") Genre genre,
                           @Param("authorId") UUID authorId,
                           Pageable pageable);
}
