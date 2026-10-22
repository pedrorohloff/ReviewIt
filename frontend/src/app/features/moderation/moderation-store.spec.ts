import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@app/core/api/api-error';
import { REVIEW_API, ReviewApi } from '@app/core/api/review-api';
import { Comment } from '@app/core/models/comment';
import { Post } from '@app/core/models/post';
import { Profile } from '@app/core/models/profile';
import {
  ModerationAction,
  ModerationActionInput,
  Report,
  ReportPage,
  ReportStatus,
} from '@app/core/models/report';
import { ModerationStore, MODERATION_PAGE_SIZE } from './moderation-store';

const REPORTER_ID = '10000000-0000-4000-8000-000000000002';
const AUTHOR_ID = '10000000-0000-4000-8000-000000000003';

function makeReport(index: number, overrides: Partial<Report> = {}): Report {
  return {
    id: `report-${index}`,
    reporterId: REPORTER_ID,
    postId: `post-${index}`,
    commentId: null,
    reason: `Motivo ${index}`,
    status: 'Pending',
    ...overrides,
  };
}

function makePage(content: Report[], hasNext = false): ReportPage {
  return {
    content,
    totalElements: content.length + (hasNext ? MODERATION_PAGE_SIZE : 0),
    totalPages: hasNext ? 2 : 1,
    hasNext,
  };
}

function makePost(id: string): Post {
  return {
    id,
    author: { id: AUTHOR_ID, username: 'João Lima', avatarUrl: null },
    title: `Review ${id}`,
    contentType: 'Book',
    genre: 'Drama',
    content: 'Conteúdo.',
    notifyEnabled: false,
    notifyChannel: 'In-App',
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeComment(id: string, postId: string): Comment {
  return {
    id,
    postId,
    author: { id: AUTHOR_ID, username: 'João Lima', avatarUrl: null },
    content: '  Um comentário   com espaços e quebra de linha.\n',
    likeCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeProfile(id: string): Profile {
  return {
    id,
    username: 'João Lima',
    avatarUrl: null,
    role: 'Regular',
    status: 'Active',
    suspendedUntil: null,
    createdAt: '2026-01-15T12:00:00Z',
    onboarded: true,
  };
}

function setup(
  api: {
    listReports?: (page: number, pageSize: number, status?: ReportStatus) => Observable<ReportPage>;
    applyModerationAction?: (
      reportId: string,
      input: ModerationActionInput,
    ) => Observable<ModerationAction>;
  } = {},
) {
  const listReports = vi.fn(
    api.listReports ??
      ((page: number) =>
        of(
          page === 0
            ? makePage([makeReport(1), makeReport(2)], true)
            : makePage([makeReport(3)]),
        )),
  );
  const applyModerationAction = vi.fn(
    api.applyModerationAction ??
      (() =>
        of({
          reportId: 'report-1',
          moderatorId: 'mod',
          targetUserId: AUTHOR_ID,
          actionType: 'Warn' as const,
          durationDays: null,
        })),
  );

  TestBed.configureTestingModule({
    providers: [
      ModerationStore,
      {
        provide: REVIEW_API,
        useValue: {
          listReports,
          applyModerationAction,
          getProfile: (id: string) => of(makeProfile(id)),
          getPost: (id: string) => of(makePost(id)),
          getComment: (id: string) => of(makeComment(id, 'post-comment')),
        } as unknown as ReviewApi,
      },
    ],
  });

  return {
    store: TestBed.inject(ModerationStore),
    listReports,
    applyModerationAction,
  };
}

describe('ModerationStore', () => {
  it('loads the pending queue and resolves reporter and target labels', () => {
    const { store, listReports } = setup();

    store.load();

    expect(listReports).toHaveBeenCalledWith(0, MODERATION_PAGE_SIZE, 'Pending');
    expect(store.reports().map((report) => report.id)).toEqual(['report-1', 'report-2']);
    expect(store.status()).toBe('ready');
    expect(store.hasNext()).toBe(true);
    expect(store.totalElements()).toBe(MODERATION_PAGE_SIZE + 2);
    expect(store.reporters().get(REPORTER_ID)).toBe('João Lima');
    expect(store.targets().get('report-1')).toEqual({
      kind: 'post',
      label: 'Review post-1',
      author: 'João Lima',
      postId: 'post-1',
    });
  });

  it('loads the resolved tab with the status filter', () => {
    const { store, listReports } = setup({
      listReports: () => of(makePage([makeReport(9, { status: 'Resolved' })])),
    });

    store.load('Resolved');

    expect(listReports).toHaveBeenCalledWith(0, MODERATION_PAGE_SIZE, 'Resolved');
    expect(store.reports()[0]?.status).toBe('Resolved');
    expect(store.hasNext()).toBe(false);
  });

  it('resolves a reported comment with its excerpt and post link', () => {
    const { store } = setup({
      listReports: () =>
        of(
          makePage([
            makeReport(4, {
              postId: null,
              commentId: 'comment-4',
            }),
          ]),
        ),
    });

    store.load();

    expect(store.targets().get('report-4')).toEqual({
      kind: 'comment',
      label: 'Um comentário com espaços e quebra de linha.',
      author: 'João Lima',
      postId: 'post-comment',
    });
  });

  it('appends the next page and keeps the queue status ready', () => {
    const { store, listReports } = setup();

    store.load();
    store.loadMore();

    expect(listReports).toHaveBeenLastCalledWith(1, MODERATION_PAGE_SIZE, 'Pending');
    expect(store.reports()).toHaveLength(3);
    expect(store.status()).toBe('ready');
  });

  it('drops a resolved report from the pending queue', () => {
    const { store } = setup({
      listReports: () => of(makePage([makeReport(1), makeReport(2)])),
    });

    store.load();
    store.resolve('report-1');

    expect(store.reports().map((report) => report.id)).toEqual(['report-2']);
    expect(store.totalElements()).toBe(1);
    expect(store.status()).toBe('ready');

    store.resolve('report-2');

    expect(store.reports()).toHaveLength(0);
    expect(store.status()).toBe('empty');
  });

  it('marks a report resolved instead of removing it on the resolved tab', () => {
    const { store } = setup({
      listReports: () => of(makePage([makeReport(1, { status: 'Resolved' })])),
    });

    store.load('Resolved');
    store.resolve('report-1');

    expect(store.reports()).toHaveLength(1);
    expect(store.reports()[0]?.status).toBe('Resolved');
  });

  it('exposes the API error and retries the request', () => {
    const failing = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiError(500, 'Erro', 'Falhou.')))
      .mockReturnValue(of(makePage([makeReport(1)])));
    const { store } = setup({ listReports: failing });

    store.load();

    expect(store.status()).toBe('error');
    expect(store.error()?.message).toBe('Falhou.');

    store.retry();

    expect(store.status()).toBe('ready');
    expect(store.reports()).toHaveLength(1);
  });
});
