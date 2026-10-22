import { Observable, defer, delay, of, throwError } from 'rxjs';
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
import { DEMO_USER } from '@app/core/auth/demo-user';
import { normalizeText } from '@app/shared/utils/text';
import {
  MockState,
  loadMockState,
  newId,
  saveMockState,
} from '@app/mocks/mock-seed';
import { ApiError } from './api-error';
import { ReviewApi } from './review-api';

export interface MockLatency {
  min: number;
  max: number;
}

const DEFAULT_LATENCY: MockLatency = { min: 250, max: 450 };

/**
 * Local data adapter used when Supabase is not configured. It keeps a small
 * deterministic dataset in localStorage so feedback (likes, comments, drafts)
 * survives a reload without any backend.
 *
 * It is always built by the `REVIEW_API` factory (never by the injector), so it
 * intentionally has no `@Injectable` decorator: the optional latency would not
 * be a valid injection token.
 */
export class MockReviewApi extends ReviewApi {
  private readonly state: MockState;

  constructor(private readonly latency: MockLatency = DEFAULT_LATENCY) {
    super();
    this.state = loadMockState(getStorage());
  }

  listPosts(params: ListPostsParams): Observable<PostPage> {
    return this.respond(() => {
      const pageSize = Math.max(1, params.pageSize);
      const filtered = this.filteredPosts(params);
      const start = params.page * pageSize;
      const content = filtered.slice(start, start + pageSize).map((post) => this.withLike(post));
      const totalElements = filtered.length;

      return {
        content,
        totalElements,
        totalPages: Math.ceil(totalElements / pageSize),
        hasNext: start + content.length < totalElements,
      };
    });
  }

  getPost(id: string): Observable<Post> {
    return this.respond(() => this.withLike(this.requirePost(id)));
  }

  createPost(input: PostInput): Observable<Post> {
    return this.respond(() => {
      const now = new Date().toISOString();
      const author = this.requireProfile(DEMO_USER.id);

      const post: Post = {
        id: newId('post'),
        author: {
          id: author.id,
          username: author.username,
          avatarUrl: author.avatarUrl,
        },
        title: input.title,
        contentType: input.contentType,
        genre: input.genre,
        content: input.content,
        notifyEnabled: true,
        notifyChannel: 'In-App',
        likeCount: 0,
        commentCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      this.state.posts.unshift(post);
      this.persist();
      return this.withLike(post);
    });
  }

  updatePost(id: string, input: PostInput): Observable<Post> {
    return this.respond(() => {
      const post = this.requirePost(id);
      this.requireAuthor(post);

      post.title = input.title;
      post.contentType = input.contentType;
      post.genre = input.genre;
      post.content = input.content;
      post.updatedAt = new Date().toISOString();

      this.persist();
      return this.withLike(post);
    });
  }

  deletePost(id: string): Observable<void> {
    return this.respond(() => {
      const post = this.requirePost(id);
      this.requireAuthor(post);

      this.state.posts = this.state.posts.filter((candidate) => candidate.id !== id);
      this.state.comments = this.state.comments.filter((comment) => comment.postId !== id);
      this.persist();
    });
  }

  updateNotificationSettings(
    id: string,
    input: NotificationSettingsInput,
  ): Observable<Post> {
    return this.respond(() => {
      const post = this.requirePost(id);
      this.requireAuthor(post);

      post.notifyEnabled = input.notifyEnabled;
      post.notifyChannel = input.notifyChannel;
      post.updatedAt = new Date().toISOString();

      this.persist();
      return this.withLike(post);
    });
  }

  listComments(postId: string, page: number, pageSize: number): Observable<CommentPage> {
    return this.respond(() => {
      this.requirePost(postId);
      const size = Math.max(1, pageSize);
      const comments = this.state.comments
        .filter((comment) => comment.postId === postId)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      const start = page * size;
      const content = comments
        .slice(start, start + size)
        .map((comment) => this.withCommentLike(comment));

      return {
        comments: content,
        totalElements: comments.length,
        totalPages: Math.ceil(comments.length / size),
        hasNext: start + content.length < comments.length,
      };
    });
  }

  getComment(id: string): Observable<Comment> {
    return this.respond(() => {
      const comment = this.state.comments.find((candidate) => candidate.id === id);
      if (!comment) {
        throw notFound('Comentário não encontrado.');
      }

      return { ...comment, author: { ...comment.author } };
    });
  }

  createComment(postId: string, input: CommentInput): Observable<Comment> {
    return this.respond(() => {
      const post = this.requirePost(postId);
      const author = this.requireProfile(DEMO_USER.id);
      const now = new Date().toISOString();

      const comment: Comment = {
        id: newId('comment'),
        postId,
        author: {
          id: author.id,
          username: author.username,
          avatarUrl: author.avatarUrl,
        },
        content: input.content,
        likeCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      this.state.comments.push(comment);
      post.commentCount = this.state.comments.filter((item) => item.postId === postId).length;
      this.persist();

      return this.withCommentLike(comment);
    });
  }

  deleteComment(id: string): Observable<void> {
    return this.respond(() => {
      const comment = this.state.comments.find((candidate) => candidate.id === id);
      if (!comment) {
        throw notFound('Comentário não encontrado.');
      }

      if (comment.author.id !== DEMO_USER.id) {
        throw forbidden('Você só pode remover comentários seus.');
      }

      this.state.comments = this.state.comments.filter((candidate) => candidate.id !== id);
      const post = this.state.posts.find((candidate) => candidate.id === comment.postId);
      if (post) {
        post.commentCount = this.state.comments.filter(
          (candidate) => candidate.postId === post.id,
        ).length;
      }

      this.persist();
    });
  }

  togglePostLike(postId: string): Observable<LikeResult> {
    return this.respond(() => {
      const post = this.requirePost(postId);
      const liked = this.toggleLike(this.state.likedPostIds, postId);

      post.likeCount = Math.max(0, post.likeCount + (liked ? 1 : -1));
      this.persist();

      return { liked, likeCount: post.likeCount };
    });
  }

  toggleCommentLike(commentId: string): Observable<LikeResult> {
    return this.respond(() => {
      const comment = this.state.comments.find((candidate) => candidate.id === commentId);
      if (!comment) {
        throw notFound('Comentário não encontrado.');
      }

      const liked = this.toggleLike(this.state.likedCommentIds, commentId);
      comment.likeCount = Math.max(0, comment.likeCount + (liked ? 1 : -1));
      this.persist();

      return { liked, likeCount: comment.likeCount };
    });
  }

  getProfile(id: string): Observable<Profile> {
    return this.respond(() => ({ ...this.requireProfile(id) }));
  }

  updateProfile(id: string, input: ProfileInput): Observable<Profile> {
    return this.respond(() => {
      if (id !== DEMO_USER.id) {
        throw forbidden('Você só pode editar o seu próprio perfil.');
      }

      const profile = this.requireProfile(id);
      profile.username = input.username;
      profile.avatarUrl = input.avatarUrl;

      for (const post of this.state.posts) {
        if (post.author.id === id) {
          post.author.username = input.username;
          post.author.avatarUrl = input.avatarUrl;
        }
      }

      for (const comment of this.state.comments) {
        if (comment.author.id === id) {
          comment.author.username = input.username;
          comment.author.avatarUrl = input.avatarUrl;
        }
      }

      this.persist();
      return { ...profile };
    });
  }

  listNotifications(page: number, pageSize: number): Observable<NotificationPage> {
    return this.respond(() => {
      const size = Math.max(1, pageSize);
      const notifications = this.state.notifications.filter(
        (notification) => notification.userId === DEMO_USER.id,
      );
      const start = page * size;
      const content = notifications.slice(start, start + size);

      return {
        notifications: content,
        totalElements: notifications.length,
        totalPages: Math.ceil(notifications.length / size),
        hasNext: start + content.length < notifications.length,
      };
    });
  }

  markNotificationRead(id: string): Observable<void> {
    return this.respond(() => {
      const notification = this.state.notifications.find((candidate) => candidate.id === id);
      if (!notification) {
        throw notFound('Notificação não encontrada.');
      }

      notification.readAt = new Date().toISOString();
      this.persist();
    });
  }

  createReport(input: ReportInput): Observable<Report> {
    return this.respond(() => {
      if (!input.postId && !input.commentId) {
        throw new ApiError(400, 'Dados inválidos', 'Informe o conteúdo denunciado.');
      }

      const report: Report = {
        id: newId('report'),
        reporterId: DEMO_USER.id,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        reason: input.reason,
        status: 'Pending',
      };

      this.state.reports.unshift(report);
      this.persist();
      return { ...report };
    });
  }

  listReports(
    page: number,
    pageSize: number,
    status?: ReportStatus,
  ): Observable<ReportPage> {
    return this.respond(() => {
      const size = Math.max(1, pageSize);
      const reports = status
        ? this.state.reports.filter((report) => report.status === status)
        : this.state.reports;
      const start = page * size;
      const content = reports.slice(start, start + size);

      return {
        content: content.map((report) => ({ ...report })),
        totalElements: reports.length,
        totalPages: Math.ceil(reports.length / size),
        hasNext: start + content.length < reports.length,
      };
    });
  }

  applyModerationAction(
    reportId: string,
    input: ModerationActionInput,
  ): Observable<ModerationAction> {
    return this.respond(() => {
      const report = this.state.reports.find((candidate) => candidate.id === reportId);
      if (!report) {
        throw notFound('Denúncia não encontrada.');
      }

      if (report.status === 'Resolved') {
        throw new ApiError(400, 'Dados inválidos', 'Esta denúncia já foi resolvida.');
      }

      const post = report.postId
        ? this.state.posts.find((candidate) => candidate.id === report.postId)
        : undefined;
      const comment = report.commentId
        ? this.state.comments.find((candidate) => candidate.id === report.commentId)
        : undefined;

      if ((report.postId && !post) || (report.commentId && !comment)) {
        throw notFound('Conteúdo da denúncia não encontrado.');
      }

      if (input.actionType === 'Suspend' && (!input.durationDays || input.durationDays < 1)) {
        throw new ApiError(400, 'Dados inválidos', 'Informe a duração da suspensão em dias.');
      }

      const targetUserId = post?.author.id ?? comment?.author.id ?? null;
      this.applyModerationSideEffect(report, input, targetUserId);

      const action: ModerationAction = {
        reportId,
        moderatorId: DEMO_USER.id,
        targetUserId,
        actionType: input.actionType,
        durationDays: input.durationDays ?? null,
      };

      report.status = 'Resolved';
      this.state.actions.unshift(action);
      this.persist();

      return { ...action };
    });
  }

  private applyModerationSideEffect(
    report: Report,
    input: ModerationActionInput,
    targetUserId: string | null,
  ): void {
    if (input.actionType === 'Remove') {
      if (report.postId) {
        this.state.posts = this.state.posts.filter((post) => post.id !== report.postId);
        this.state.comments = this.state.comments.filter(
          (comment) => comment.postId !== report.postId,
        );
        this.state.notifications = this.state.notifications.filter(
          (notification) => notification.postId !== report.postId,
        );
        return;
      }

      if (report.commentId) {
        const removed = this.state.comments.find((comment) => comment.id === report.commentId);
        this.state.comments = this.state.comments.filter(
          (comment) => comment.id !== report.commentId,
        );

        const post = this.state.posts.find((candidate) => candidate.id === removed?.postId);
        if (post) {
          post.commentCount = Math.max(0, post.commentCount - 1);
        }
      }
      return;
    }

    if ((input.actionType === 'Suspend' || input.actionType === 'Ban') && targetUserId) {
      const profile = this.state.profiles.find((candidate) => candidate.id === targetUserId);
      if (!profile) {
        return;
      }

      profile.status = input.actionType === 'Ban' ? 'Banned' : 'Suspended';
      profile.suspendedUntil =
        input.actionType === 'Suspend'
          ? new Date(Date.now() + (input.durationDays ?? 0) * 86_400_000).toISOString()
          : null;
    }
  }

  private filteredPosts(params: ListPostsParams): Post[] {
    const query = params.q?.trim() ? normalizeText(params.q.trim()) : '';
    const filtered = this.state.posts.filter((post) => {
      if (params.contentType && post.contentType !== params.contentType) {
        return false;
      }
      if (params.genre && post.genre !== params.genre) {
        return false;
      }
      if (params.authorId && post.author.id !== params.authorId) {
        return false;
      }
      if (query) {
        const haystack = normalizeText(
          `${post.title} ${post.content} ${post.author.username}`,
        );
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });

    const sort = params.sort ?? 'recent';
    filtered.sort((left, right) => {
      if (sort === 'popular') {
        const byLikes = right.likeCount - left.likeCount;
        if (byLikes !== 0) {
          return byLikes;
        }
      }

      const byDate = right.createdAt.localeCompare(left.createdAt);
      return byDate !== 0 ? byDate : right.id.localeCompare(left.id);
    });

    return filtered;
  }

  private withLike(post: Post): Post {
    return {
      ...post,
      author: { ...post.author },
      likedByMe: this.state.likedPostIds.includes(post.id),
    };
  }

  private withCommentLike(comment: Comment): Comment {
    return {
      ...comment,
      author: { ...comment.author },
      likedByMe: this.state.likedCommentIds.includes(comment.id),
    };
  }

  private toggleLike(list: string[], id: string): boolean {
    const index = list.indexOf(id);
    if (index >= 0) {
      list.splice(index, 1);
      return false;
    }

    list.push(id);
    return true;
  }

  private requirePost(id: string): Post {
    const post = this.state.posts.find((candidate) => candidate.id === id);
    if (!post) {
      throw notFound('Review não encontrada.');
    }

    return post;
  }

  private requireProfile(id: string): Profile {
    const profile = this.state.profiles.find((candidate) => candidate.id === id);
    if (!profile) {
      throw notFound('Perfil não encontrado.');
    }

    return profile;
  }

  private requireAuthor(post: Post): void {
    if (post.author.id !== DEMO_USER.id) {
      throw forbidden('Você só pode editar as suas próprias reviews.');
    }
  }

  private persist(): void {
    saveMockState(this.state, getStorage());
  }

  private respond<T>(factory: () => T): Observable<T> {
    return defer(() => {
      try {
        return of(factory());
      } catch (error) {
        return throwError(() => error);
      }
    }).pipe(delay(this.nextLatency()));
  }

  private nextLatency(): number {
    const { min, max } = this.latency;
    if (max <= min) {
      return Math.max(0, min);
    }

    return Math.round(min + Math.random() * (max - min));
  }
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function notFound(message: string): ApiError {
  return new ApiError(404, 'Não encontrado', message);
}

function forbidden(message: string): ApiError {
  return new ApiError(403, 'Acesso negado', message);
}
