package com.pedrorohloff.post;

import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Builds the {@link Specification} used by the recent feed and by the count
 * query of the popular feed. The popular repository query duplicates these
 * predicates in JPQL because a {@link Specification} cannot be applied to a
 * {@code @Query} method; tests cover both paths so they cannot diverge silently.
 */
public final class PostSpecifications {

    private static final char LIKE_ESCAPE = '\\';

    private PostSpecifications() {
    }

    public static Specification<Post> withFilter(PostQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            String pattern = likePattern(query.q());
            if (pattern != null) {
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern, LIKE_ESCAPE),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("content")), pattern, LIKE_ESCAPE)
                ));
            }
            if (query.contentType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("contentType"), query.contentType()));
            }
            if (query.genre() != null) {
                predicates.add(criteriaBuilder.equal(root.get("genre"), query.genre()));
            }
            if (query.authorId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("authorId"), query.authorId()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Wraps the search term in a case-insensitive {@code LIKE} pattern, escaping
     * the LIKE wildcards so a user typing {@code %} does not match everything.
     * Returns {@code null} when there is no search term.
     */
    public static String likePattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.trim().toLowerCase()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }
}
