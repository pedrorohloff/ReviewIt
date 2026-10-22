import { ApplicationRef, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { AuthUser } from '@app/core/auth/auth-user';
import { AvatarMenu } from './avatar-menu';

@Component({ template: '' })
class BlankPage {}

interface AuthStub {
  user: ReturnType<typeof signal<AuthUser | null>>;
  role: ReturnType<typeof signal<AuthUser['role'] | null>>;
  isDemo: ReturnType<typeof signal<boolean>>;
  isAuthenticated: ReturnType<typeof signal<boolean>>;
  signOut: () => Promise<void>;
}

async function setup(auth?: AuthStub): Promise<ComponentFixture<AvatarMenu>> {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'blank', component: BlankPage }])],
  });

  if (auth) {
    TestBed.overrideProvider(AuthService, { useValue: auth });
  }

  const fixture = TestBed.createComponent(AvatarMenu);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function triggerOf(fixture: ComponentFixture<AvatarMenu>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.account__trigger') as HTMLButtonElement;
}

function menuOf(fixture: ComponentFixture<AvatarMenu>): HTMLElement | null {
  return fixture.nativeElement.querySelector('[role="menu"]');
}

function itemsOf(fixture: ComponentFixture<AvatarMenu>): HTMLElement[] {
  const element = fixture.nativeElement as HTMLElement;
  return Array.from(element.querySelectorAll<HTMLElement>('[role="menuitem"]'));
}

function open(fixture: ComponentFixture<AvatarMenu>): HTMLElement {
  triggerOf(fixture).click();
  fixture.detectChanges();
  return menuOf(fixture)!;
}

describe('AvatarMenu', () => {
  it('opens the account links from the avatar', async () => {
    const fixture = await setup();
    const trigger = triggerOf(fixture);

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-label')).toBe('Menu da conta de Maria Rohls');

    open(fixture);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Meu perfil');
    expect(fixture.nativeElement.textContent).toContain('Notificações');
    expect(fixture.nativeElement.textContent).toContain('Moderação');
    expect(fixture.nativeElement.textContent).toContain('Nova review');
    expect(fixture.nativeElement.textContent).toContain('Demonstração');
    // Demo sessions have no real sign out.
    expect(fixture.nativeElement.textContent).not.toContain('Sair');
  });

  it('hides the moderation link from regular accounts', async () => {
    const user: AuthUser = {
      id: 'regular-1',
      email: null,
      username: 'Regular',
      avatarUrl: null,
      role: 'Regular',
      status: 'Active',
    };
    const fixture = await setup({
      user: signal<AuthUser | null>(user),
      role: signal<AuthUser['role'] | null>('Regular'),
      isDemo: signal(false),
      isAuthenticated: signal(true),
      signOut: async () => undefined,
    });

    open(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Moderação');
    expect(fixture.nativeElement.textContent).toContain('Notificações');
  });

  it('focuses the first item when it opens', async () => {
    const fixture = await setup();

    open(fixture);
    TestBed.inject(ApplicationRef).tick();

    expect(document.activeElement).toBe(itemsOf(fixture)[0]);
  });

  it('closes on Escape and returns the focus to the avatar', async () => {
    const fixture = await setup();
    const trigger = triggerOf(fixture);

    open(fixture);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(menuOf(fixture)).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes when the pointer goes down outside the menu', async () => {
    const fixture = await setup();

    open(fixture);

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(menuOf(fixture)).toBeNull();
  });

  it('closes on a route change', async () => {
    const fixture = await setup();

    open(fixture);
    await TestBed.inject(Router).navigateByUrl('/blank');
    fixture.detectChanges();

    expect(menuOf(fixture)).toBeNull();
  });

  it('walks through the items with the arrow keys and wraps around', async () => {
    const fixture = await setup();

    const menu = open(fixture);
    const items = itemsOf(fixture);
    items[0]!.focus();

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[items.length - 1]);

    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
  });
});
