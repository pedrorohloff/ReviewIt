import { Injectable } from '@angular/core';

const STORAGE_KEY = 'reviewit:feed-scroll';

interface StoredScroll {
  scrollTop: number;
  filterKey: string;
}

/**
 * Remembers where the feed was scrolled to so returning from a post lands the
 * user back on the same card. Backed by `sessionStorage`: a reload keeps the
 * position, a new tab starts clean, and nothing leaks between sessions.
 */
@Injectable({ providedIn: 'root' })
export class ScrollMemoryService {
  save(scrollTop: number, filterKey: string): void {
    this.write({ scrollTop: Math.max(0, Math.round(scrollTop)), filterKey });
  }

  /** Returns the offset saved for `filterKey`, consuming it. */
  consume(filterKey: string): number | null {
    const stored = this.read();

    if (!stored || stored.filterKey !== filterKey) {
      return null;
    }

    this.clear();
    return stored.scrollTop;
  }

  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode); scroll restoration is optional.
    }
  }

  private read(): StoredScroll | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<StoredScroll>;

      if (typeof parsed.scrollTop !== 'number' || typeof parsed.filterKey !== 'string') {
        return null;
      }

      return { scrollTop: parsed.scrollTop, filterKey: parsed.filterKey };
    } catch {
      return null;
    }
  }

  private write(value: StoredScroll): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore: a missing position only means no restoration.
    }
  }
}
