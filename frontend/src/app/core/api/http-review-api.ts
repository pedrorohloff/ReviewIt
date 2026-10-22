import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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
import { ReviewApi } from './review-api';

@Injectable()
export class HttpReviewApi extends ReviewApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  listPosts(params: ListPostsParams): Observable<PostPage> {
    let query = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);

    if (params.q?.trim()) {
      query = query.set('q', params.q.trim());
    }
    if (params.contentType) {
      query = query.set('contentType', params.contentType);
    }
    if (params.genre) {
      query = query.set('genre', params.genre);
    }
    if (params.sort) {
      query = query.set('sort', params.sort);
    }
    if (params.authorId) {
      query = query.set('authorId', params.authorId);
    }

    return this.http.get<PostPage>(`${this.baseUrl}/posts`, { params: query });
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/posts/${id}`);
  }

  createPost(input: PostInput): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, input);
  }

  updatePost(id: string, input: PostInput): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/posts/${id}`, input);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${id}`);
  }

  updateNotificationSettings(
    id: string,
    input: NotificationSettingsInput,
  ): Observable<Post> {
    return this.http.patch<Post>(`${this.baseUrl}/posts/${id}/notification-settings`, input);
  }

  listComments(postId: string, page: number, pageSize: number): Observable<CommentPage> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<CommentPage>(`${this.baseUrl}/posts/${postId}/comments`, { params });
  }

  getComment(id: string): Observable<Comment> {
    return this.http.get<Comment>(`${this.baseUrl}/comments/${id}`);
  }

  createComment(postId: string, input: CommentInput): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/posts/${postId}/comments`, input);
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${id}`);
  }

  togglePostLike(postId: string): Observable<LikeResult> {
    return this.http.post<LikeResult>(`${this.baseUrl}/posts/${postId}/like`, {});
  }

  toggleCommentLike(commentId: string): Observable<LikeResult> {
    return this.http.post<LikeResult>(`${this.baseUrl}/comments/${commentId}/like`, {});
  }

  getProfile(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/profiles/${id}`);
  }

  updateProfile(id: string, input: ProfileInput): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/profiles/${id}`, input);
  }

  listNotifications(page: number, pageSize: number): Observable<NotificationPage> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<NotificationPage>(`${this.baseUrl}/notifications`, { params });
  }

  markNotificationRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/notifications/${id}/read`, {
      readAt: new Date().toISOString(),
    });
  }

  createReport(input: ReportInput): Observable<Report> {
    return this.http.post<Report>(`${this.baseUrl}/reports`, {
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      reason: input.reason,
    });
  }

  listReports(
    page: number,
    pageSize: number,
    status?: ReportStatus,
  ): Observable<ReportPage> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ReportPage>(`${this.baseUrl}/reports`, { params });
  }

  applyModerationAction(
    reportId: string,
    input: ModerationActionInput,
  ): Observable<ModerationAction> {
    return this.http.post<ModerationAction>(`${this.baseUrl}/reports/${reportId}/action`, {
      actionType: input.actionType,
      durationDays: input.durationDays ?? null,
    });
  }
}
