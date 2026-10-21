import { TestBed } from '@angular/core/testing';
import { ScrollMemoryService } from './scroll-memory.service';

const STORAGE_KEY = 'reviewit:feed-scroll';

describe('ScrollMemoryService', () => {
  let service: ScrollMemoryService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollMemoryService);
  });

  afterEach(() => sessionStorage.clear());

  it('returns the saved offset for the matching filters once', () => {
    service.save(640, '||recent');

    expect(service.consume('||recent')).toBe(640);
    expect(service.consume('||recent')).toBeNull();
  });

  it('ignores the offset when the filters changed', () => {
    service.save(640, 'duna||recent');

    expect(service.consume('||recent')).toBeNull();
  });

  it('ignores a corrupted or foreign stored value', () => {
    sessionStorage.setItem(STORAGE_KEY, 'not json');

    expect(service.consume('||recent')).toBeNull();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ scrollTop: 10 }));

    expect(service.consume('||recent')).toBeNull();
  });

  it('never stores a negative offset', () => {
    service.save(-20.4, '||recent');

    expect(service.consume('||recent')).toBe(0);
  });

  it('clears the stored position', () => {
    service.save(320, '||recent');
    service.clear();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
