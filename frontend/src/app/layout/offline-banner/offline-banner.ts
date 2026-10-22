import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { Icon } from '@app/shared/ui/icon/icon';

/**
 * Global connectivity banner. The browser fires `online`/`offline` on the
 * window, so the shell can surface the state before an action fails; the pages
 * keep their own retry states for requests that fail while offline.
 */
@Component({
  selector: 'app-offline-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (!online()) {
      <div class="offline" role="status">
        <app-icon name="triangle-alert" [size]="16" />
        <p>Você está sem conexão. Algumas ações podem falhar até a conexão voltar.</p>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    :host(.is-hidden) {
      display: none;
    }

    .offline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      border: 1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
      border-radius: var(--radius-control);
      background: var(--color-danger-soft);
      color: var(--color-ink-strong);
    }

    p {
      margin: 0;
      font-size: 0.78125rem;
      line-height: 1.45;
    }
  `,
  host: {
    '[class.is-hidden]': 'online()',
    '(window:online)': 'onOnline()',
    '(window:offline)': 'onOffline()',
  },
})
export class OfflineBanner {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly _online = signal(this.window?.navigator.onLine ?? true);

  protected readonly online = this._online.asReadonly();

  protected onOnline(): void {
    this._online.set(true);
  }

  protected onOffline(): void {
    this._online.set(false);
  }
}
