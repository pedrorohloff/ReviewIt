import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
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
import { ToasterService } from '@app/core/services/toaster.service';
import { ModerationPage } from './moderation-page';

const REPORTER_ID = '10000000-0000-4000-8000-000000000002';

function makeReport(index: number, overrides: Partial<Report> = {}): Report {
  return {
    id: `report-${index}`,
    reporterId: REPORTER_ID,
    postId: `post-${index}`,
    commentId: null,
    reason: `Motivo da denúncia ${index}`,
    status: 'Pending',
    ...overrides,
  };
}

function makePage(content: Report[], hasNext = false): ReportPage {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    hasNext,
  };
}

function makePost(id: string): Post {
  return {
    id,
    author: { id: 'author-1', username: 'João Lima', avatarUrl: null },
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

function makeComment(id: string): Comment {
  return {
    id,
    postId: 'post-3',
    author: { id: 'author-2', username: 'Lena Souza', avatarUrl: null },
    content: 'Comentário denunciado com um trecho.',
    likeCount: 0,
    likedByMe: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeProfile(id: string): Profile {
  return {
    id,
    username: 'Bia Nunes',
    avatarUrl: null,
    role: 'Moderator',
    status: 'Active',
    suspendedUntil: null,
    createdAt: '2026-01-15T12:00:00Z',
    onboarded: true,
  };
}

interface ApiStub {
  listReports?: (page: number, pageSize: number, status?: ReportStatus) => Observable<ReportPage>;
  applyModerationAction?: (
    reportId: string,
    input: ModerationActionInput,
  ) => Observable<ModerationAction>;
}

function setup(api: ApiStub = {}) {
  const pending = [makeReport(1), makeReport(2), makeReport(3, { postId: null, commentId: 'comment-3' })];
  const resolved = [makeReport(4, { status: 'Resolved' })];

  const listReports = vi.fn(
    api.listReports ??
      ((_page: number, _pageSize: number, status?: ReportStatus) =>
        of(makePage(status === 'Resolved' ? resolved : pending))),
  );
  const applyModerationAction = vi.fn(
    api.applyModerationAction ??
      ((reportId: string, input: ModerationActionInput) =>
        of({
          reportId,
          moderatorId: 'mod-1',
          targetUserId: 'author-1',
          actionType: input.actionType,
          durationDays: input.durationDays ?? null,
        })),
  );

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: REVIEW_API,
        useValue: {
          listReports,
          applyModerationAction,
          getProfile: (id: string) => of(makeProfile(id)),
          getPost: (id: string) => of(makePost(id)),
          getComment: (id: string) => of(makeComment(id)),
        } as unknown as ReviewApi,
      },
    ],
  });

  const fixture = TestBed.createComponent(ModerationPage);
  fixture.detectChanges();

  return {
    fixture,
    element: fixture.nativeElement as HTMLElement,
    listReports,
    applyModerationAction,
    toaster: TestBed.inject(ToasterService),
  };
}

function button(root: HTMLElement, label: string): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.trim().includes(label),
  );

  if (!match) {
    throw new Error(`Button "${label}" not found.`);
  }

  return match;
}

function text(fixture: ComponentFixture<ModerationPage>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('ModerationPage', () => {
  it('renders the pending queue with reporter, reason and target', () => {
    const { fixture, element } = setup();

    expect(element.querySelector('h1')?.textContent).toContain('Moderação');
    expect(TestBed.inject(Title).getTitle()).toBe('Moderação · ReviewIt');
    expect(element.querySelectorAll('.report')).toHaveLength(3);
    expect(text(fixture)).toContain('3 denúncias pendentes');
    expect(text(fixture)).toContain('Denúncia de Bia Nunes');
    expect(text(fixture)).toContain('Motivo da denúncia 1');
    expect(text(fixture)).toContain('Review post-1');
    expect(text(fixture)).toContain('Comentário denunciado com um trecho.');
    expect(text(fixture)).toContain('por Lena Souza');
    expect(element.querySelectorAll('.report__action')).toHaveLength(3);
  });

  it('switches to the resolved tab and hides the action button', () => {
    const { fixture, element, listReports } = setup();

    button(element, 'Resolvidas').click();
    fixture.detectChanges();

    expect(listReports).toHaveBeenLastCalledWith(0, 10, 'Resolved');
    expect(element.querySelectorAll('.report')).toHaveLength(1);
    expect(text(fixture)).toContain('1 denúncia resolvida');
    expect(text(fixture)).toContain('Resolvida');
    expect(element.querySelectorAll('.report__action')).toHaveLength(0);
  });

  it('applies a warning, closes the dialog and removes the row', () => {
    const { fixture, element, applyModerationAction, toaster } = setup();

    button(element, 'Aplicar ação').click();
    fixture.detectChanges();

    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Motivo da denúncia 1');

    button(dialog, 'Confirmar ação').click();
    fixture.detectChanges();

    expect(applyModerationAction).toHaveBeenCalledWith('report-1', { actionType: 'Warn' });
    expect(element.querySelector('[role="dialog"]')).toBeNull();
    expect(element.querySelectorAll('.report')).toHaveLength(2);
    expect(toaster.toasts().at(-1)?.message).toBe('Advertência aplicada.');
  });

  it('requires a valid duration before suspending an account', () => {
    const { fixture, element, applyModerationAction } = setup();

    button(element, 'Aplicar ação').click();
    fixture.detectChanges();

    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    const select = dialog.querySelector('#moderation-action') as HTMLSelectElement;
    select.value = 'Suspend';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const days = dialog.querySelector('#moderation-days') as HTMLInputElement;
    const confirm = button(dialog, 'Confirmar ação');
    expect(dialog.textContent).toContain('Dias de suspensão');
    // Seven days is the default, so the action starts ready to submit.
    expect(confirm.disabled).toBe(false);

    days.value = '0';
    days.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(true);

    days.value = '7';
    days.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(confirm.disabled).toBe(false);

    confirm.click();
    fixture.detectChanges();

    expect(applyModerationAction).toHaveBeenCalledWith('report-1', {
      actionType: 'Suspend',
      durationDays: 7,
    });
  });

  it('keeps the dialog open and toasts when the action fails', () => {
    const { fixture, element, toaster } = setup({
      applyModerationAction: () =>
        throwError(() => new ApiError(403, 'Acesso negado', 'Sem permissão para esta ação.')),
    });

    button(element, 'Aplicar ação').click();
    fixture.detectChanges();

    const dialog = element.querySelector('[role="dialog"]') as HTMLElement;
    button(dialog, 'Confirmar ação').click();
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.querySelectorAll('.report')).toHaveLength(3);
    expect(toaster.toasts().at(-1)?.message).toBe('Sem permissão para esta ação.');
  });

  it('shows the empty state when the queue has no reports', () => {
    const { element } = setup({ listReports: () => of(makePage([])) });

    expect(textFrom(element)).toContain('Fila em dia');
    expect(element.querySelectorAll('.report')).toHaveLength(0);
  });

  it('shows the error state and retries', () => {
    const failing = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new ApiError(500, 'Erro', 'Falhou.')))
      .mockReturnValue(of(makePage([makeReport(1)])));
    const { fixture, element } = setup({ listReports: failing });

    expect(textFrom(element)).toContain('Não foi possível carregar as denúncias');

    button(element, 'Tentar novamente').click();
    fixture.detectChanges();

    expect(element.querySelectorAll('.report')).toHaveLength(1);
  });
});

function textFrom(element: HTMLElement): string {
  return element.textContent ?? '';
}
