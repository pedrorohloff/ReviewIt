import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription } from 'rxjs';
import { ApiError, toApiError } from '@app/core/api/api-error';
import { REVIEW_API } from '@app/core/api/review-api';
import { Report, ReportStatus, ModerationAction, ModerationActionInput } from '@app/core/models/report';

export type ModerationTab = 'Pending' | 'Resolved';

export type ModerationStatus =
  | 'idle'
  | 'loading'
  | 'loadingMore'
  | 'ready'
  | 'empty'
  | 'error'
  | 'errorMore';

/** What the report points at, resolved from the ids in the payload. */
export interface ReportTarget {
  kind: 'post' | 'comment';
  label: string;
  author: string;
  postId: string;
}

export const MODERATION_PAGE_SIZE = 10;
const EXCERPT_LENGTH = 120;

function excerpt(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > EXCERPT_LENGTH ? `${flat.slice(0, EXCERPT_LENGTH - 1)}…` : flat;
}

/**
 * Moderation queue. Component-scoped with the console page: the active tab,
 * pagination and the resolved reporter/target labels belong to that view.
 *
 * The API payload only carries ids, so the display data is resolved lazily per
 * report (bounded by the page size) and cached for the session.
 */
@Injectable()
export class ModerationStore {
  private readonly api = inject(REVIEW_API);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _tab = signal<ModerationTab>('Pending');
  private readonly _reports = signal<Report[]>([]);
  private readonly _status = signal<ModerationStatus>('idle');
  private readonly _hasNext = signal(false);
  private readonly _total = signal(0);
  private readonly _error = signal<ApiError | null>(null);
  private readonly _reporters = signal<ReadonlyMap<string, string | null>>(new Map());
  private readonly _targets = signal<ReadonlyMap<string, ReportTarget | null>>(new Map());

  private page = 0;
  private request?: Subscription;

  readonly tab = this._tab.asReadonly();
  readonly reports = this._reports.asReadonly();
  readonly status = this._status.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly totalElements = this._total.asReadonly();
  readonly error = this._error.asReadonly();
  readonly reporters = this._reporters.asReadonly();
  readonly targets = this._targets.asReadonly();

  readonly isInitialLoading = computed(
    () => this._status() === 'loading' && this._reports().length === 0,
  );
  readonly isLoadingMore = computed(() => this._status() === 'loadingMore');

  constructor() {
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(tab: ModerationTab = this._tab()): void {
    this._tab.set(tab);
    this._reports.set([]);
    this._total.set(0);
    this._hasNext.set(false);
    this.page = 0;
    this.fetch(0, true);
  }

  loadMore(): void {
    if (this._status() !== 'ready' || !this._hasNext()) {
      return;
    }

    this.fetch(this.page + 1, false);
  }

  retry(): void {
    if (this._status() === 'error') {
      this.fetch(0, true);
    } else if (this._status() === 'errorMore') {
      this.fetch(this.page + 1, false);
    }
  }

  apply(report: Report, input: ModerationActionInput): Observable<ModerationAction> {
    return this.api.applyModerationAction(report.id, input);
  }

  /**
   * Mirrors a successful action locally: the report leaves the pending queue
   * (or flips to resolved if the resolved tab were open).
   */
  resolve(reportId: string): void {
    if (!this._reports().some((report) => report.id === reportId)) {
      return;
    }

    if (this._tab() === 'Pending') {
      const remaining = this._reports().filter((report) => report.id !== reportId);
      this._reports.set(remaining);
      this._total.update((total) => Math.max(0, total - 1));

      if (remaining.length === 0 && !this._hasNext()) {
        this._status.set('empty');
      }

      return;
    }

    this._reports.update((reports) =>
      reports.map((report) =>
        report.id === reportId ? { ...report, status: 'Resolved' as ReportStatus } : report,
      ),
    );
  }

  private fetch(page: number, reset: boolean): void {
    this.request?.unsubscribe();
    this._status.set(reset ? 'loading' : 'loadingMore');
    this._error.set(null);

    this.request = this.api
      .listReports(page, MODERATION_PAGE_SIZE, this._tab())
      .subscribe({
        next: (result) => {
          const reports = reset ? result.content : [...this._reports(), ...result.content];
          this._reports.set(reports);
          this._total.set(result.totalElements);
          this._hasNext.set(result.hasNext);
          this.page = page;
          this._status.set(reports.length === 0 ? 'empty' : 'ready');
          // The list is "ready" even on the last page; the button is hidden by
          // `hasNext`, and the count line carries the end of the queue.
          this.resolveDetails(result.content);
        },
        error: (error: unknown) => {
          this._error.set(toApiError(error));
          this._status.set(reset ? 'error' : 'errorMore');
        },
      });
  }

  private resolveDetails(reports: Report[]): void {
    for (const report of reports) {
      this.resolveReporter(report);
      this.resolveTarget(report);
    }
  }

  private resolveReporter(report: Report): void {
    if (this._reporters().has(report.reporterId)) {
      return;
    }

    const reporterId = report.reporterId;
    this.api
      .getProfile(reporterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) =>
          this._reporters.update((reporters) => new Map(reporters).set(reporterId, profile.username)),
        error: () => this._reporters.update((reporters) => new Map(reporters).set(reporterId, null)),
      });
  }

  private resolveTarget(report: Report): void {
    if (this._targets().has(report.id)) {
      return;
    }

    if (report.postId) {
      this.api
        .getPost(report.postId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (post) =>
            this.setTarget(report.id, {
              kind: 'post',
              label: post.title,
              author: post.author.username,
              postId: post.id,
            }),
          error: () => this.setTarget(report.id, null),
        });
      return;
    }

    if (!report.commentId) {
      this.setTarget(report.id, null);
      return;
    }

    this.api
      .getComment(report.commentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) =>
          this.setTarget(report.id, {
            kind: 'comment',
            label: excerpt(comment.content),
            author: comment.author.username,
            postId: comment.postId,
          }),
        error: () => this.setTarget(report.id, null),
      });
  }

  private setTarget(reportId: string, target: ReportTarget | null): void {
    this._targets.update((targets) => new Map(targets).set(reportId, target));
  }
}
