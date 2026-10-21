import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

let nextId = 1;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal confirmation used for destructive actions and for the report reason.
 * Content is projected into the body, so callers can add a field.
 *
 * Behaviour per §7.8: backdrop and Escape close it, focus moves inside and is
 * restored on destroy, Tab wraps around, and the confirm button can be busy or
 * disabled.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previouslyFocused = this.document.activeElement as HTMLElement | null;

  readonly title = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly busyLabel = input('Enviando…');
  readonly busy = input(false);
  readonly confirmDisabled = input(false);
  readonly tone = input<'default' | 'danger'>('default');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleId = `confirm-dialog-title-${nextId++}`;
  protected readonly confirmClass = computed(() =>
    this.tone() === 'danger' ? 'btn btn--danger' : 'btn',
  );

  constructor() {
    afterNextRender(() => {
      const host = this.element.nativeElement;
      const autofocus = host.querySelector<HTMLElement>('[data-autofocus]');
      (autofocus ?? host.querySelector<HTMLElement>('.dialog'))?.focus();
    });

    this.destroyRef.onDestroy(() => this.previouslyFocused?.focus());
  }

  protected cancel(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }

  protected confirm(): void {
    if (!this.busy() && !this.confirmDisabled()) {
      this.confirmed.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const host = this.element.nativeElement;
    const focusable = Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE));

    if (focusable.length === 0) {
      return;
    }

    const first = focusable.at(0);
    const last = focusable.at(-1);
    const active = this.document.activeElement;

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
