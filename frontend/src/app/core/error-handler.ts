import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ApiError } from './api/api-error';
import { ToasterService } from './services/toaster.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly toaster = inject(ToasterService);

  handleError(error: unknown): void {
    console.error(error);

    if (error instanceof ApiError) {
      // The HTTP layer already mapped and surfaced known API failures.
      return;
    }

    this.toaster.error('Algo deu errado. Tente novamente.');
  }
}
