package com.pedrorohloff.post;

import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.PostSort;

import java.util.UUID;

/**
 * Search and filter criteria for the posts feed. All fields are optional.
 */
public record PostQuery(
        String q,
        ContentType contentType,
        Genre genre,
        UUID authorId,
        PostSort sort
) {
    public PostQuery {
        if (sort == null) {
            sort = PostSort.RECENT;
        }
    }
}
