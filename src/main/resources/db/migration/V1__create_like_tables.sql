-- V1: Create Like tables

CREATE TABLE post_likes (
    id          UUID PRIMARY KEY,
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_post_user UNIQUE (post_id, user_id)
);

CREATE TABLE comment_likes (
    id          UUID PRIMARY KEY,
    comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_comment_user UNIQUE (comment_id, user_id)
);
