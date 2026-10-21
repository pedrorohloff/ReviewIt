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
      padding: 24px;
      border: 1.5px solid var(--color-olive);
      border-radius: var(--radius-panel);
      background: var(--color-surface);
      text-align: center;
    }

    .not-found {
      max-width: 420px;
    }

    .not-found__eyebrow {
      margin: 0 0 4px;
      color: var(--color-olive);
      font-size: 11px;
      font-weight: 650;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: var(--color-olive);
      font-family: var(--font-display);
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }

    .not-found__copy {
      margin: 12px 0 20px;
      color: var(--color-olive);
      font-size: 13.5px;
      line-height: 1.6;
    }

    .not-found__link {
      display: inline-flex;
      height: 40px;
      align-items: center;
      padding: 0 18px;
      border: 1.5px solid var(--color-sage-deep);
      border-radius: 999px;
      background: var(--color-sage);
      color: var(--color-ink-strong);
      font-size: 12.5px;
      font-weight: 650;
    }
  `,
})
export class NotFoundPage {}
