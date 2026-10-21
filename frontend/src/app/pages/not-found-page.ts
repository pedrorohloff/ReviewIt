import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <p class="not-found__eyebrow">404</p>
      <h1>Essa página saiu para ler.</h1>
      <p class="not-found__copy">
        O endereço não existe ou ainda não foi construído. O feed continua logo ali.
      </p>
      <a class="not-found__link" routerLink="/">Voltar para o feed</a>
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

    .not-found {
      max-width: 26.25rem;
    }

    .not-found__eyebrow {
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

    .not-found__copy {
      margin: 0.75rem 0 1.25rem;
      color: var(--color-muted);
      font-size: 0.84375rem;
      line-height: 1.6;
    }

    .not-found__link {
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
  `,
})
export class NotFoundPage {}
