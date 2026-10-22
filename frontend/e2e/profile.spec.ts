import { Page, expect, test } from '@playwright/test';

/** Maria is the demo user and the author of the first (newest) review. */
const MARIA_ID = '10000000-0000-4000-8000-000000000001';
const PAGE_SIZE = 12;
/** Maria has 11 reviews in the demo seed and the profile page loads 8. */
const MARIA_REVIEWS = 11;
const PROFILE_PAGE_SIZE = 8;

async function clickVisibleCard(page: Page): Promise<void> {
  await page.evaluate(() => {
    const panel = document.querySelector('.feed-panel') as HTMLElement;
    const rect = panel.getBoundingClientRect();
    const cards = Array.from(document.querySelectorAll('app-review-card'));
    const visible = cards.find((card) => {
      const box = card.getBoundingClientRect();
      return box.top >= rect.top && box.bottom <= rect.bottom && box.height > 0;
    });
    const link = (visible ?? cards.at(0))?.querySelector('.card__link') as HTMLElement | null;
    link?.click();
  });
}

test.describe('profile', () => {
  test('opens an author profile and paginates independently from the feed', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await clickVisibleCard(page);
    const author = (await page.locator('.byline__name').innerText()).trim();
    expect(author).toBe('Maria Rohls');

    await page.getByRole('link', { name: 'Ver perfil' }).click();
    await expect(page).toHaveURL(`/profile/${MARIA_ID}`);

    await expect(page.getByRole('heading', { level: 1, name: author })).toBeVisible();
    await expect(page.locator('.role-chip')).toHaveText('Admin');
    await expect(page.getByText('Entrou em 15 de janeiro de 2026')).toBeVisible();
    await expect(page.locator('.profile-list app-review-card')).toHaveCount(PROFILE_PAGE_SIZE);

    await page.getByRole('button', { name: 'Carregar mais reviews' }).click();

    await expect(page.locator('.profile-list app-review-card')).toHaveCount(MARIA_REVIEWS);
    // Maria is the demo user, so her page uses the own-profile copy.
    await expect(page.getByRole('heading', { level: 2, name: 'Suas reviews' })).toBeVisible();
    await expect(page.getByText('Fim das suas reviews.')).toBeVisible();

    // The main feed was not touched by the author feed.
    await page.goBack();
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
  });

  test('shows a friendly state for an unknown profile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/profile/00000000-0000-4000-8000-000000000099');

    await expect(page.getByText('Perfil não encontrado')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar para o feed' }).click();
    await expect(page).toHaveURL('/');
  });

  test('edits the own profile and persists the new name', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto(`/profile/${MARIA_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Maria Rohls' })).toBeVisible();

    await page.getByRole('button', { name: 'Editar perfil' }).click();
    await expect(page.getByRole('dialog', { name: 'Editar perfil' })).toBeVisible();

    await page.getByLabel('Nome de usuário').fill('Maria do E2E');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page.getByText('Perfil atualizado.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Maria do E2E' })).toBeVisible();
    await expect(
      page.locator('.profile-head').getByRole('img', { name: 'Foto de Maria do E2E' }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Maria do E2E' })).toBeVisible();
  });
});
