import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="forbidden">
      <p class="forbidden__eyebrow">403</p>
      <h1>Acesso negado.</h1>
      <p class="forbidden__copy">
        Sua conta não tem permissão para abrir esta área. Se você acha que isso é um engano, tente
        entrar novamente.
      </p>
      <a class="forbidden__link" routerLink="/">Voltar para o feed</a>
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

    .forbidden {
      max-width: 26.25rem;
    }

    .forbidden__eyebrow {
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
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .forbidden__copy {
      margin: 0.75rem 0 1.5rem;
      color: var(--color-muted);
      font-size: 0.9375rem;
    }

    .forbidden__link {
      display: inline-flex;
      align-items: center;
      height: 2.5rem;
      padding: 0 1.125rem;
      border: 1.5px solid var(--color-border-strong);
      border-radius: var(--radius-control);
      color: var(--color-ink-strong);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .forbidden__link:hover {
      background: var(--color-surface-muted);
    }
  `,
})
export class ForbiddenPage {}
