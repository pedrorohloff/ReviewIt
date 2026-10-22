import { Page, expect, test } from '@playwright/test';

const MARIA_ID = '10000000-0000-4000-8000-000000000001';

async function openAccountMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menu da conta' }).click();
  await expect(page.getByRole('menu', { name: 'Conta' })).toBeVisible();
}

test.describe('account menu', () => {
  test('opens from the keyboard, closes on Escape and returns the focus', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Menu da conta de Maria Rohls' });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const menu = page.getByRole('menu', { name: 'Conta' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem').first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('links to the own profile, notifications and the editor', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/');

    await openAccountMenu(page);
    await expect(page.getByRole('menuitem', { name: 'Meu perfil' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Notificações' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Nova review' })).toBeVisible();
    await expect(page.locator('.account__name')).toHaveText('Maria Rohls');

    await page.getByRole('menuitem', { name: 'Meu perfil' }).click();
    await expect(page).toHaveURL(`/profile/${MARIA_ID}`);
    await expect(page.getByRole('menu', { name: 'Conta' })).toHaveCount(0);

    // Reopening and choosing another route closes the menu again.
    await openAccountMenu(page);
    await page.getByRole('menuitem', { name: 'Nova review' }).click();
    await expect(page).toHaveURL('/new');
    await expect(page.getByRole('menu', { name: 'Conta' })).toHaveCount(0);
  });
});
