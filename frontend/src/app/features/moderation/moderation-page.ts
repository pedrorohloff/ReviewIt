import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { toApiError } from '@app/core/api/api-error';
import {
  ModerationActionInput,
  ModerationActionType,
  Report,
  ReportStatus,
} from '@app/core/models/report';
import { ToasterService } from '@app/core/services/toaster.service';
import { ScrollRail } from '@app/layout/scroll-rail/scroll-rail';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '@app/shared/ui/icon/icon';
import { REPORT_STATUS_LABELS } from '@app/shared/utils/format';
import { ModerationStore, ModerationTab, ReportTarget } from './moderation-store';

interface ActionOption {
  value: ModerationActionType;
  label: string;
}

const ACTION_OPTIONS: ActionOption[] = [
  { value: 'Warn', label: 'Advertir autor' },
  { value: 'Remove', label: 'Remover conteúdo' },
  { value: 'Suspend', label: 'Suspender conta' },
  { value: 'Ban', label: 'Banir conta' },
];

const ACTION_MESSAGES: Record<ModerationActionType, string> = {
  Remove:
    'O conteúdo denunciado será removido e a denúncia marcada como resolvida. Esta ação não pode ser desfeita.',
  Warn: 'O autor recebe uma advertência e a denúncia é marcada como resolvida.',
  Suspend:
    'A conta do autor fica suspensa pelo período informado e a denúncia é marcada como resolvida.',
  Ban: 'A conta do autor é banida e a denúncia marcada como resolvida. Esta ação não pode ser desfeita.',
};

const ACTION_SUCCESS: Record<ModerationActionType, string> = {
  Remove: 'Conteúdo removido.',
  Warn: 'Advertência aplicada.',
  Suspend: 'Conta suspensa.',
  Ban: 'Conta banida.',
};

const MIN_SUSPEND_DAYS = 1;
const MAX_SUSPEND_DAYS = 365;

/**
 * Moderation queue for Moderators and Admins, gated by `moderatorGuard`.
 * The pending and resolved tabs filter on the server; applying an action
 * removes the report from the pending queue without a full reload.
 */
@Component({
  selector: 'app-moderation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, Icon, RouterLink, ScrollRail],
  providers: [ModerationStore],
  templateUrl: './moderation-page.html',
  styleUrl: './moderation-page.css',
})
export class ModerationPage implements OnInit {
  private readonly store = inject(ModerationStore);
  private readonly toaster = inject(ToasterService);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly panel = viewChild<ElementRef<HTMLElement>>('moderationPanel');

  protected readonly actionOptions = ACTION_OPTIONS;
  protected readonly skeletonRows = [1, 2, 3];
  protected readonly reports = this.store.reports;
  protected readonly status = this.store.status;
  protected readonly tab = this.store.tab;
  protected readonly hasNext = this.store.hasNext;
  protected readonly errorMessage = computed(
    () => this.store.error()?.message ?? 'Não foi possível carregar as denúncias agora.',
  );
  protected readonly countLabel = computed(() => {
    const status = this.status();

    if (status === 'idle' || status === 'loading' || status === 'error') {
      return '';
    }

    const total = this.store.totalElements();
    const pending = this.tab() === 'Pending';
    const noun = total === 1 ? 'denúncia' : 'denúncias';

    return `${total} ${noun} ${pending ? 'pendente' : 'resolvida'}${total === 1 ? '' : 's'}`;
  });

  protected readonly dialogReport = signal<Report | null>(null);
  protected readonly actionType = signal<ModerationActionType>('Warn');
  protected readonly durationDays = signal('7');
  protected readonly applying = signal(false);
  protected readonly actionMessage = computed(() => ACTION_MESSAGES[this.actionType()]);
  protected readonly actionTone = computed<'default' | 'danger'>(() =>
    this.actionType() === 'Remove' || this.actionType() === 'Ban' ? 'danger' : 'default',
  );
  protected readonly confirmDisabled = computed(
    () =>
      this.applying() ||
      (this.actionType() === 'Suspend' && !this.isValidDuration(this.durationDays())),
  );
  protected readonly dialogTarget = computed(() => {
    const report = this.dialogReport();
    return report ? (this.store.targets().get(report.id) ?? null) : null;
  });

  ngOnInit(): void {
    this.title.setTitle('Moderação · ReviewIt');
    this.store.load();
  }

  protected setTab(tab: ModerationTab): void {
    if (tab === this.tab() || this.status() === 'loading') {
      return;
    }

    this.store.load(tab);
  }

  protected loadMore(): void {
    this.store.loadMore();
  }

  protected retry(): void {
    this.store.retry();
  }

  protected statusLabel(status: ReportStatus): string {
    return REPORT_STATUS_LABELS[status];
  }

  protected reporterLoading(report: Report): boolean {
    return !this.store.reporters().has(report.reporterId);
  }

  protected reporterLabel(report: Report): string | null {
    return this.store.reporters().get(report.reporterId) ?? null;
  }

  protected targetLoading(report: Report): boolean {
    return !this.store.targets().has(report.id);
  }

  protected targetFor(report: Report): ReportTarget | null {
    return this.store.targets().get(report.id) ?? null;
  }

  protected openAction(report: Report): void {
    this.actionType.set('Warn');
    this.durationDays.set('7');
    this.dialogReport.set(report);
  }

  protected closeDialog(): void {
    if (this.applying()) {
      return;
    }

    this.dialogReport.set(null);
  }

  protected onActionChange(event: Event): void {
    this.actionType.set((event.target as HTMLSelectElement).value as ModerationActionType);
  }

  protected onDaysInput(event: Event): void {
    this.durationDays.set((event.target as HTMLInputElement).value);
  }

  protected confirmAction(): void {
    const report = this.dialogReport();

    if (!report || this.confirmDisabled()) {
      return;
    }

    const actionType = this.actionType();
    const input: ModerationActionInput =
      actionType === 'Suspend'
        ? { actionType, durationDays: Number(this.durationDays()) }
        : { actionType };

    this.applying.set(true);
    this.store
      .apply(report, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.applying.set(false);
          this.dialogReport.set(null);
          this.store.resolve(report.id);
          this.toaster.success(ACTION_SUCCESS[actionType]);
        },
        error: (error: unknown) => {
          this.applying.set(false);
          this.toaster.error(toApiError(error).message);
        },
      });
  }

  private isValidDuration(raw: string): boolean {
    const days = Number(raw);

    return (
      Number.isInteger(days) && days >= MIN_SUSPEND_DAYS && days <= MAX_SUSPEND_DAYS
    );
  }
}
