import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

/**
 * Route-level failure screen used by `handleNavigationError`, which covers
 * lazy-chunk, resolver and guard failures. `retry` carries the URL that failed
 * so "Tentar novamente" repeats the same navigation.
 */
@Component({
  selector: 'app-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="error-state">
      <p class="error-state__eyebrow">Erro</p>
      <h1>Não foi possível abrir esta página.</h1>
      <p class="error-state__copy">
        Algo falhou ao carregar o conteúdo. Tente novamente; se continuar, volte para o feed e
        recomece por lá.
      </p>
      <div class="error-state__actions">
        <button type="button" class="error-state__retry" (click)="retry()">
          Tentar novamente
        </button>
        <a class="error-state__link" routerLink="/">Voltar para o feed</a>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: grid;
      height: 100%;
      place-items: center;
      padding: 1.5rem;
      border: 1.5px solid var(--color-border-strong);
      border-radius: var(--radius-panel);
      background: var(--color-surface);
      text-align: center;
    }

    .error-state {
      max-width: 28rem;
    }

    .error-state__eyebrow {
      margin: 0 0 0.25rem;
      color: var(--color-muted);
      font-size: 0.6875rem;
      font-weight: 650;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--color-ink-strong);
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .error-state__copy {
      margin: 0.75rem 0 1.25rem;
      color: var(--color-muted);
      font-size: 0.84375rem;
      line-height: 1.6;
    }

    .error-state__actions {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .error-state__retry {
      display: inline-flex;
      height: 2.5rem;
      align-items: center;
      padding: 0 1.125rem;
      border: 1.5px solid var(--color-ink);
      border-radius: var(--radius-control);
      background: var(--color-ink);
      color: var(--color-surface);
      font-size: 0.78125rem;
      font-weight: 650;
    }

    .error-state__retry:hover {
      border-color: var(--color-ink-strong);
      background: var(--color-ink-strong);
    }

    .error-state__link {
      display: inline-flex;
      height: 2.5rem;
      align-items: center;
      padding: 0 1.125rem;
      border: 1.5px solid var(--color-border-strong);
      border-radius: var(--radius-control);
      color: var(--color-ink-strong);
      font-size: 0.78125rem;
      font-weight: 650;
    }

    .error-state__link:hover {
      background: var(--color-surface-muted);
    }
  `,
})
export class ErrorPage {
  private readonly router = inject(Router);
  private readonly retryUrl = signal(this.safeRetryUrl(inject(ActivatedRoute).snapshot.queryParamMap));

  protected retry(): void {
    void this.router.navigateByUrl(this.retryUrl());
  }

  /** Only in-app paths are retried; anything else falls back to the feed. */
  private safeRetryUrl(params: { get(name: string): string | null }): string {
    const retry = params.get('retry') ?? '/';

    return retry.startsWith('/') && !retry.startsWith('//') ? retry : '/';
  }
}
