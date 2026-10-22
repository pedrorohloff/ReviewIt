import { TestBed } from '@angular/core/testing';
import { ToasterService } from './toaster.service';

describe('ToasterService', () => {
  let toaster: ToasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    toaster = TestBed.inject(ToasterService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps at most four toasts, dropping the oldest', () => {
    for (const message of ['um', 'dois', 'três', 'quatro', 'cinco']) {
      toaster.info(message);
    }

    expect(toaster.toasts().map((toast) => toast.message)).toEqual([
      'dois',
      'três',
      'quatro',
      'cinco',
    ]);
  });

  it('dismisses a toast when its duration elapses', () => {
    toaster.success('Salvo');

    expect(toaster.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(4000);
    expect(toaster.toasts()).toHaveLength(0);
  });

  it('dismisses one toast without touching the others', () => {
    toaster.info('Primeiro');
    toaster.error('Segundo');

    const first = toaster.toasts()[0];
    if (!first) {
      throw new Error('expected a toast to dismiss');
    }
    toaster.dismiss(first.id);

    expect(toaster.toasts().map((toast) => toast.message)).toEqual(['Segundo']);
  });
});
