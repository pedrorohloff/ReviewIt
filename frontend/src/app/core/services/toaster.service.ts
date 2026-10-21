import { Injectable, signal } from '@angular/core';

export type ToastKind = 'info' | 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 4;

@Injectable({ providedIn: 'root' })
export class ToasterService {
  private readonly _toasts = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  readonly toasts = this._toasts.asReadonly();

  show(message: string, kind: ToastKind = 'info', duration = DEFAULT_DURATION): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, message, kind }].slice(-MAX_TOASTS));

    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.timers.set(id, timer);
    }
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
