import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemFieldError {
  field: string;
  message: string;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: ProblemFieldError[];
}

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly title: string,
    message: string,
    readonly fieldErrors: Readonly<Record<string, string>> = {},
  ) {
    super(message);
  }
}

const STATUS_TITLES: Record<number, string> = {
  0: 'Falha de conexão',
  400: 'Dados inválidos',
  401: 'Sessão expirada',
  403: 'Acesso negado',
  404: 'Não encontrado',
  409: 'Conflito',
  422: 'Dados inválidos',
  500: 'Erro no servidor',
};

const STATUS_MESSAGES: Record<number, string> = {
  0: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'O conteúdo solicitado não foi encontrado.',
  500: 'O servidor não conseguiu concluir a operação.',
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const problem = isProblemDetail(error.error) ? error.error : null;
    const status = error.status || 0;
    const title = problem?.title || STATUS_TITLES[status] || 'Erro inesperado';
    const detail =
      problem?.detail ||
      (error.status === 0
        ? STATUS_MESSAGES[0]
        : STATUS_MESSAGES[status] || 'Não foi possível concluir a operação.') ||
      'Não foi possível concluir a operação.';

    return new ApiError(status, title, detail, fieldErrorsFrom(problem));
  }

  if (error instanceof Error) {
    return new ApiError(0, 'Erro inesperado', error.message);
  }

  return new ApiError(0, 'Erro inesperado', 'Não foi possível concluir a operação.');
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null;
}

function fieldErrorsFrom(problem: ProblemDetail | null): Record<string, string> {
  const errors = problem?.errors;

  if (!Array.isArray(errors)) {
    return {};
  }

  return errors.reduce<Record<string, string>>((acc, error) => {
    if (error && typeof error.field === 'string' && typeof error.message === 'string') {
      acc[error.field] = error.message;
    }

    return acc;
  }, {});
}
