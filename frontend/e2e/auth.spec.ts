import { expect, test } from '@playwright/test';

test.describe('auth and demo mode', () => {
  test('shows the demo badge and signed-in avatar in the shell', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');

    await expect(page.locator('app-top-bar').getByText('modo demonstração')).toBeVisible();
    await expect(
      page.locator('app-top-bar').getByRole('img', { name: 'Foto de Maria Rohls' }),
    ).toBeVisible();
  });

  test('explains demo mode on /login and returns to the feed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/login');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Reviews de quem entende');
    await expect(page.getByText('modo demonstração', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Explorar em modo demonstração' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
  });

  test('respects a safe next parameter after entering the demo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/login?next=%2Fpagina-que-nao-existe');

    await page.getByRole('button', { name: 'Explorar em modo demonstração' }).click();

    await expect(page).toHaveURL('/pagina-que-nao-existe');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Essa página saiu para ler.' }),
    ).toBeVisible();
  });

  test('renders the 403 page inside the shell', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/403');

    await expect(page.getByRole('heading', { level: 1, name: 'Acesso negado.' })).toBeVisible();
    await expect(page.locator('app-top-bar')).toBeVisible();
  });
});
