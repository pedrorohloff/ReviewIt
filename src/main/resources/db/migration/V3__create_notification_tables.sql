-- V3: Create Notification table

CREATE TABLE notifications (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    channel     VARCHAR(10) NOT NULL,
    read_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
