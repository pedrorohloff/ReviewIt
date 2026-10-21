import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, toApiError } from './api-error';

describe('toApiError', () => {
  it('keeps an existing ApiError untouched', () => {
    const original = new ApiError(403, 'Acesso negado', 'Sem permissão.');
    expect(toApiError(original)).toBe(original);
  });

  it('maps an RFC 7807 body including field errors', () => {
    const response = new HttpErrorResponse({
      status: 400,
      error: {
        title: 'Dados inválidos',
        detail: 'Corrija os campos destacados.',
        errors: [{ field: 'title', message: 'deve ter entre 5 e 200 caracteres' }],
      },
    });

    const mapped = toApiError(response);

    expect(mapped.status).toBe(400);
    expect(mapped.title).toBe('Dados inválidos');
    expect(mapped.message).toBe('Corrija os campos destacados.');
    expect(mapped.fieldErrors['title']).toBe('deve ter entre 5 e 200 caracteres');
  });

  it('falls back to friendly copy when the problem body has no detail', () => {
    const mapped = toApiError(new HttpErrorResponse({ status: 404, error: 'Not Found' }));

    expect(mapped.status).toBe(404);
    expect(mapped.title).toBe('Não encontrado');
    expect(mapped.message).toBe('O conteúdo solicitado não foi encontrado.');
  });

  it('maps network failures', () => {
    const mapped = toApiError(new HttpErrorResponse({ status: 0 }));

    expect(mapped.status).toBe(0);
    expect(mapped.title).toBe('Falha de conexão');
    expect(mapped.message).toContain('conectar');
  });

  it('wraps unknown values', () => {
    const mapped = toApiError(undefined);

    expect(mapped.status).toBe(0);
    expect(mapped.message).toBe('Não foi possível concluir a operação.');
  });
});
