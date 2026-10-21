import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToasterService, ToastKind } from '@app/core/services/toaster.service';
import { Icon, IconName } from '@app/shared/ui/icon/icon';

@Component({
  selector: 'app-toast-region',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toaster.toasts(); track toast.id) {
        <div
          class="toast"
          [class.toast--error]="toast.kind === 'error'"
          [class.toast--success]="toast.kind === 'success'"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
        >
          <app-icon class="toast__icon" [name]="iconFor(toast.kind)" [size]="18" />
          <p class="toast__message">{{ toast.message }}</p>
          <button
            type="button"
            class="toast__close"
            aria-label="Fechar aviso"
            (click)="toaster.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1.25rem;
      bottom: 1.25rem;
      z-index: 120;
      display: flex;
      width: min(22rem, calc(100vw - 2rem));
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.75rem 0.875rem;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-panel);
      background: var(--color-surface);
      box-shadow: var(--shadow-popover);
      pointer-events: auto;
    }

    .toast__icon {
      margin-top: 0.0625rem;
      color: var(--color-muted);
    }

    .toast--error {
      border-color: var(--color-danger);
    }

    .toast--error .toast__icon {
      color: var(--color-danger);
    }

    .toast--success .toast__icon {
      color: var(--color-olive);
    }

    .toast__message {
      margin: 0;
      flex: 1;
      color: var(--color-ink);
      font-size: 0.8125rem;
      line-height: 1.45;
    }

    .toast__close {
      display: grid;
      width: 1.5rem;
      height: 1.5rem;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 50%;
      color: var(--color-muted);
      transition: background-color 120ms ease-out;
    }

    .toast__close:hover {
      background: var(--color-surface-muted);
    }

    @media (max-width: 639px) {
      .toasts {
        top: 1rem;
        right: 1rem;
        bottom: auto;
        left: 1rem;
        width: auto;
      }
    }
  `,
})
export class ToastRegion {
  protected readonly toaster = inject(ToasterService);

  protected iconFor(kind: ToastKind): IconName {
    switch (kind) {
      case 'success':
        return 'circle-check';
      case 'error':
        return 'triangle-alert';
      default:
        return 'info';
    }
  }
}
