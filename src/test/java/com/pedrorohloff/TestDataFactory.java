package com.pedrorohloff;

import com.pedrorohloff.comment.Comment;
import com.pedrorohloff.like.CommentLike;
import com.pedrorohloff.like.PostLike;
import com.pedrorohloff.moderation.ModerationAction;
import com.pedrorohloff.moderation.Report;
import com.pedrorohloff.moderation.enums.ActionType;
import com.pedrorohloff.moderation.enums.ReportStatus;
import com.pedrorohloff.notification.Notification;
import com.pedrorohloff.notification.enums.DeliveryChannel;
import com.pedrorohloff.notification.enums.NotificationType;
import com.pedrorohloff.post.Post;
import com.pedrorohloff.post.enums.ContentType;
import com.pedrorohloff.post.enums.Genre;
import com.pedrorohloff.post.enums.NotifyChannel;
import com.pedrorohloff.profile.Profile;
import com.pedrorohloff.profile.enums.AccountStatus;
import com.pedrorohloff.profile.enums.Role;

import java.time.Instant;
import java.util.UUID;

public class TestDataFactory {

    // ============ Profile ============

    public static Profile createProfile(String username) {
        return createProfile(username, Role.REGULAR, AccountStatus.ACTIVE, null);
    }

    public static Profile createProfile(String username, Role role) {
        return createProfile(username, role, AccountStatus.ACTIVE, null);
    }

    public static Profile createProfile(String username, AccountStatus status) {
        return createProfile(username, Role.REGULAR, status, null);
    }

    public static Profile createProfile(String username, Role role, AccountStatus status, Instant suspendedUntil) {
        Profile profile = new Profile();
        profile.setId(UUID.randomUUID());
        profile.setUsername(username);
        profile.setAvatarUrl("https://example.com/" + username + ".png");
        profile.setRole(role);
        profile.setAccountStatus(status);
        profile.setSuspendedUntil(suspendedUntil);
        return profile;
    }

    // ============ Post ============

    public static Post createPost(UUID authorId) {
        return createPost(authorId, "Test Post Title", ContentType.BOOK, Genre.ACTION);
    }

    public static Post createPost(UUID authorId, String title) {
        return createPost(authorId, title, ContentType.BOOK, Genre.ACTION);
    }

    public static Post createPost(UUID authorId, ContentType contentType, Genre genre) {
        return createPost(authorId, "Test Post Title", contentType, genre);
    }

    public static Post createPost(UUID authorId, String title, ContentType contentType, Genre genre) {
        Post post = new Post();
        post.setId(UUID.randomUUID());
        post.setAuthorId(authorId);
        post.setTitle(title);
        post.setContentType(contentType);
        post.setGenre(genre);
        post.setContent("This is a test post content that is long enough to pass validation.");
        post.setNotifyEnabled(true);
        post.setNotifyChannel(NotifyChannel.IN_APP);
        return post;
    }

    // ============ Comment ============

    public static Comment createComment(UUID postId, UUID authorId) {
        return createComment(postId, authorId, "This is a test comment.");
    }

    public static Comment createComment(UUID postId, UUID authorId, String content) {
        Comment comment = new Comment();
        comment.setId(UUID.randomUUID());
        comment.setPostId(postId);
        comment.setAuthorId(authorId);
        comment.setContent(content);
        return comment;
    }

    // ============ PostLike ============

    public static PostLike createPostLike(UUID postId, UUID userId) {
        PostLike like = new PostLike();
        like.setId(UUID.randomUUID());
        like.setPostId(postId);
        like.setUserId(userId);
        return like;
    }

    // ============ CommentLike ============

    public static CommentLike createCommentLike(UUID commentId, UUID userId) {
        CommentLike like = new CommentLike();
        like.setId(UUID.randomUUID());
        like.setCommentId(commentId);
        like.setUserId(userId);
        return like;
    }

    // ============ Report ============

    public static Report createReport(UUID reporterId, UUID postId) {
        return createReport(reporterId, postId, null, "Inappropriate content");
    }

    public static Report createReport(UUID reporterId, UUID commentId, boolean isComment) {
        return createReport(reporterId, null, commentId, "Inappropriate content");
    }

    public static Report createReport(UUID reporterId, UUID postId, UUID commentId, String reason) {
        return createReport(reporterId, postId, commentId, reason, ReportStatus.PENDING);
    }

    public static Report createReport(UUID reporterId, UUID postId, UUID commentId, String reason, ReportStatus status) {
        Report report = new Report();
        report.setId(UUID.randomUUID());
        report.setReporterId(reporterId);
        report.setPostId(postId);
        report.setCommentId(commentId);
        report.setReason(reason);
        report.setStatus(status);
        return report;
    }

    // ============ ModerationAction ============

    public static ModerationAction createModerationAction(UUID reportId, UUID moderatorId, UUID targetUserId) {
        return createModerationAction(reportId, moderatorId, targetUserId, ActionType.WARN, null);
    }

    public static ModerationAction createModerationAction(UUID reportId, UUID moderatorId, UUID targetUserId, ActionType actionType, Integer durationDays) {
        ModerationAction action = new ModerationAction();
        action.setId(UUID.randomUUID());
        action.setReportId(reportId);
        action.setModeratorId(moderatorId);
        action.setTargetUserId(targetUserId);
        action.setActionType(actionType);
        action.setDurationDays(durationDays);
        return action;
    }

    // ============ Notification ============

    public static Notification createNotification(UUID userId, UUID postId) {
        return createNotification(userId, postId, NotificationType.NEW_COMMENT, DeliveryChannel.IN_APP, null);
    }

    public static Notification createNotification(UUID userId, UUID postId, NotificationType type, DeliveryChannel channel, Instant readAt) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUserId(userId);
        notification.setPostId(postId);
        notification.setType(type);
        notification.setChannel(channel);
        notification.setReadAt(readAt);
        return notification;
    }
}
