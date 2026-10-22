import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Comment, CommentInput, CommentPage } from '@app/core/models/comment';
import { LikeResult } from '@app/core/models/like';
import { NotificationPage } from '@app/core/models/notification';
import {
  ListPostsParams,
  NotificationSettingsInput,
  Post,
  PostInput,
  PostPage,
} from '@app/core/models/post';
import { Profile, ProfileInput } from '@app/core/models/profile';
import {
  ModerationAction,
  ModerationActionInput,
  Report,
  ReportInput,
  ReportPage,
  ReportStatus,
} from '@app/core/models/report';

/**
 * Single domain contract consumed by the UI. Components never talk to
 * HttpClient directly; the provider selects the mock or the HTTP adapter.
 */
export abstract class ReviewApi {
  abstract listPosts(params: ListPostsParams): Observable<PostPage>;
  abstract getPost(id: string): Observable<Post>;
  abstract createPost(input: PostInput): Observable<Post>;
  abstract updatePost(id: string, input: PostInput): Observable<Post>;
  abstract deletePost(id: string): Observable<void>;
  abstract updateNotificationSettings(
    id: string,
    input: NotificationSettingsInput,
  ): Observable<Post>;

  abstract listComments(postId: string, page: number, pageSize: number): Observable<CommentPage>;
  abstract getComment(id: string): Observable<Comment>;
  abstract createComment(postId: string, input: CommentInput): Observable<Comment>;
  abstract deleteComment(id: string): Observable<void>;

  abstract togglePostLike(postId: string): Observable<LikeResult>;
  abstract toggleCommentLike(commentId: string): Observable<LikeResult>;

  abstract getProfile(id: string): Observable<Profile>;
  abstract createProfile(input: ProfileInput): Observable<Profile>;
  abstract updateProfile(id: string, input: ProfileInput): Observable<Profile>;

  abstract listNotifications(page: number, pageSize: number): Observable<NotificationPage>;
  abstract markNotificationRead(id: string): Observable<void>;

  abstract createReport(input: ReportInput): Observable<Report>;
  abstract listReports(
    page: number,
    pageSize: number,
    status?: ReportStatus,
  ): Observable<ReportPage>;
  abstract applyModerationAction(
    reportId: string,
    input: ModerationActionInput,
  ): Observable<ModerationAction>;
}

export const REVIEW_API = new InjectionToken<ReviewApi>('ReviewApi');
