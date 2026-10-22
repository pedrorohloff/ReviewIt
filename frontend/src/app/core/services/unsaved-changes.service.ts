import { Injectable, computed, signal } from '@angular/core';

/**
 * Asks the user before a navigation throws away an unsaved edit.
 *
 * A route guard cannot render UI, so it awaits `ask()` while the shell keeps
 * the dialog on screen (`AppShell` reads `open`). The dialog answers through
 * `resolve`, which settles the promise the guard is waiting on.
 */
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly _open = signal(false);
  private pending: ((discard: boolean) => void) | null = null;

  readonly open = this._open.asReadonly();
  readonly message = signal(
    'Você tem alterações que ainda não foram publicadas. Se sair agora, elas serão perdidas.',
  );
  readonly isAsking = computed(() => this._open());

  /** Resolves `true` when the user accepts losing the changes. */
  ask(message = this.message()): Promise<boolean> {
    // Only one navigation is pending at a time: a second request supersedes
    // the first, so the first promise never settles with a stale answer.
    this.pending?.(false);
    this.message.set(message);
    this._open.set(true);

    return new Promise<boolean>((resolve) => {
      this.pending = resolve;
    });
  }

  resolve(discard: boolean): void {
    const pending = this.pending;
    this.pending = null;
    this._open.set(false);
    pending?.(discard);
  }
}
