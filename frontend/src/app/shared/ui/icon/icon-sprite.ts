import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Inline Lucide icons (24x24, stroke-based) rendered once per document.
 * `Icon` uses <use href="#icon-*"> to reference these symbols.
 *
 * The inline sprite avoids a wrapper dependency: lucide-angular@1.0.0
 * still declares peer support only through Angular 21.
 */
@Component({
  selector: 'app-icon-sprite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="icon-sprite" aria-hidden="true" focusable="false">
      <symbol id="icon-sliders" viewBox="0 0 24 24">
        <line x1="21" x2="14" y1="4" y2="4" />
        <line x1="10" x2="3" y1="4" y2="4" />
        <line x1="21" x2="12" y1="12" y2="12" />
        <line x1="8" x2="3" y1="12" y2="12" />
        <line x1="21" x2="16" y1="20" y2="20" />
        <line x1="12" x2="3" y1="20" y2="20" />
        <line x1="14" x2="14" y1="2" y2="6" />
        <line x1="8" x2="8" y1="10" y2="14" />
        <line x1="16" x2="16" y1="18" y2="22" />
      </symbol>

      <symbol id="icon-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </symbol>

      <symbol id="icon-x" viewBox="0 0 24 24">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </symbol>

      <symbol id="icon-heart" viewBox="0 0 24 24">
        <path
          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        />
      </symbol>

      <symbol id="icon-message" viewBox="0 0 24 24">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </symbol>

      <symbol id="icon-arrow-right" viewBox="0 0 24 24">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </symbol>

      <symbol id="icon-book" viewBox="0 0 24 24">
        <path d="M12 7v14" />
        <path
          d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
        />
      </symbol>

      <symbol id="icon-movie" viewBox="0 0 24 24">
        <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
        <path d="m6.2 5.3 3.1 3.9" />
        <path d="m12.4 3.4 3.1 4" />
        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </symbol>

      <symbol id="icon-album" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M6 12c0-1.7.7-3.2 2-4.2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M18 12c0 1.7-.7 3.2-2 4.2" />
      </symbol>

      <symbol id="icon-game" viewBox="0 0 24 24">
        <line x1="6" x2="10" y1="11" y2="11" />
        <line x1="8" x2="8" y1="9" y2="13" />
        <line x1="15" x2="15.01" y1="12" y2="12" />
        <line x1="18" x2="18.01" y1="10" y2="10" />
        <path
          d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"
        />
      </symbol>

      <symbol id="icon-chevron-down" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </symbol>

      <symbol id="icon-check" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </symbol>
    </svg>
  `,
})
export class IconSprite {}
