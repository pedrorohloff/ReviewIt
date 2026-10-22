import { TestBed } from '@angular/core/testing';
import { UnsavedChangesService } from './unsaved-changes.service';

describe('UnsavedChangesService', () => {
  function service(): UnsavedChangesService {
    TestBed.configureTestingModule({});
    return TestBed.inject(UnsavedChangesService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('keeps the request open until the dialog answers', async () => {
    const unsaved = service();

    const navigation = unsaved.ask();
    expect(unsaved.open()).toBe(true);

    unsaved.resolve(true);

    await expect(navigation).resolves.toBe(true);
    expect(unsaved.open()).toBe(false);
  });

  it('resolves false when the user keeps editing', async () => {
    const unsaved = service();

    const navigation = unsaved.ask();
    unsaved.resolve(false);

    await expect(navigation).resolves.toBe(false);
  });

  it('answers a superseded request instead of leaving it hanging', async () => {
    const unsaved = service();

    const first = unsaved.ask();
    const second = unsaved.ask();

    await expect(first).resolves.toBe(false);
    expect(unsaved.open()).toBe(true);

    unsaved.resolve(true);
    await expect(second).resolves.toBe(true);
  });
});
