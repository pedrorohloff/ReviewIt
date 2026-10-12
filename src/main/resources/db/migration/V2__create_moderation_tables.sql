-- V2: Create Moderation tables

CREATE TABLE reports (
    id          UUID PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_reporter_target UNIQUE (reporter_id, post_id, comment_id),
    CONSTRAINT chk_report_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

CREATE TABLE moderation_actions (
    id            UUID PRIMARY KEY,
    report_id     UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    moderator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type   VARCHAR(20) NOT NULL,
    duration_days INTEGER,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
