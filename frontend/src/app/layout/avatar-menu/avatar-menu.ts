import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '@app/core/auth/auth.service';
import { Avatar } from '@app/shared/ui/avatar/avatar';
import { Icon } from '@app/shared/ui/icon/icon';

/**
 * Account menu behind the top-bar avatar. Per §7.8 it closes on route change,
 * Escape and outside clicks; Escape puts the focus back on the avatar, and the
 * arrow keys walk through the items.
 */
@Component({
  selector: 'app-avatar-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar, Icon, RouterLink],
  templateUrl: './avatar-menu.html',
  styleUrl: './avatar-menu.css',
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class AvatarMenu {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected readonly menuOpen = signal(false);
  protected readonly user = this.auth.user;
  protected readonly username = computed(() => this.user()?.username ?? 'Visitante');
  protected readonly isDemo = this.auth.isDemo;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly canModerate = computed(() => {
    const role = this.auth.role();
    return role === 'Moderator' || role === 'Admin';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.close(false));

    effect(() => {
      if (!this.menuOpen()) {
        return;
      }

      // Runs after the menu is painted, so the first item exists.
      afterNextRender(() => this.items()[0]?.focus(), { injector: this.injector });
    });
  }

  protected toggle(): void {
    if (this.menuOpen()) {
      this.close();
    } else {
      this.menuOpen.set(true);
    }
  }

  protected close(returnFocus = true): void {
    if (!this.menuOpen()) {
      return;
    }

    this.menuOpen.set(false);

    if (returnFocus) {
      this.trigger()?.nativeElement.focus();
    }
  }

  protected signOut(): void {
    this.close(false);
    void this.auth.signOut();
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.items();

    if (items.length === 0) {
      return;
    }

    const active = document.activeElement as HTMLElement | null;
    const index = active ? items.indexOf(active) : -1;
    const moveTo = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        moveTo(index + 1);
        break;
      case 'ArrowUp':
        moveTo(index - 1);
        break;
      case 'Home':
        moveTo(0);
        break;
      case 'End':
        moveTo(items.length - 1);
        break;
      case 'Tab':
        // Native order continues; the menu is not a modal.
        this.close(false);
        break;
    }
  }

  protected onEscape(): void {
    this.close();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target;

    if (!this.menuOpen() || !(target instanceof Node)) {
      return;
    }

    if (!this.element.nativeElement.contains(target)) {
      this.close(false);
    }
  }

  private items(): HTMLElement[] {
    const menu = this.menu()?.nativeElement;

    if (!menu) {
      return [];
    }

    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }
}
