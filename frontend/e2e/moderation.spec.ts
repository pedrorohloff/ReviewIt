import { Page, expect, test } from '@playwright/test';

const FIRST_REVIEW = 'A casa que aprendi a habitar';
const COMMENT_EXCERPT = 'Concordo com quase tudo, só mudaria o final.';

async function openModeration(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu da conta' }).click();
  await page.getByRole('menuitem', { name: 'Moderação' }).click();
  await expect(page).toHaveURL('/moderation');
  await expect(page.getByRole('heading', { level: 1, name: 'Moderação' })).toBeVisible();
}

function rowFor(page: Page, text: string) {
  return page.locator('.report').filter({ hasText: text });
}

test.describe('moderation console', () => {
  test('shows both queues with post and comment targets', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await openModeration(page);

    await expect(page.locator('.report')).toHaveCount(3);
    await expect(page.getByText('3 denúncias pendentes')).toBeVisible();
    await expect(rowFor(page, FIRST_REVIEW)).toContainText('Denúncia de João Lima');
    await expect(rowFor(page, FIRST_REVIEW)).toContainText(
      'Conteúdo repetitivo e fora do tema da comunidade.',
    );

    const commentRow = rowFor(page, COMMENT_EXCERPT);
    await expect(commentRow).toContainText('Comentário');
    await expect(commentRow).toContainText('por João Lima');
    await expect(commentRow.locator('.report__link')).toHaveAttribute('href', /\/posts\/.+/);

    await page.getByRole('button', { name: 'Resolvidas' }).click();

    await expect(page.locator('.report')).toHaveCount(1);
    await expect(page.getByText('1 denúncia resolvida')).toBeVisible();
    await expect(page.locator('.report__action')).toHaveCount(0);
    await expect(page.locator('.report-status--resolved')).toBeVisible();
  });

  test('applies a warning and moves the report to the resolved queue', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await openModeration(page);

    const row = rowFor(page, FIRST_REVIEW);
    await expect(row.getByRole('button', { name: 'Aplicar ação' })).toBeVisible();
    await row.getByRole('button', { name: 'Aplicar ação' }).click();

    const dialog = page.getByRole('dialog', { name: 'Aplicar ação' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(FIRST_REVIEW);
    await expect(dialog.getByLabel('Ação')).toHaveValue('Warn');

    await dialog.getByRole('button', { name: 'Confirmar ação' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: 'Advertência aplicada.' })).toBeVisible();
    await expect(page.locator('.report')).toHaveCount(2);
    await expect(page.getByText('2 denúncias pendentes')).toBeVisible();

    await page.getByRole('button', { name: 'Resolvidas' }).click();

    await expect(page.locator('.report')).toHaveCount(2);
    await expect(rowFor(page, FIRST_REVIEW)).toContainText('Resolvida');
  });

  test('removes the reported review from the feed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await openModeration(page);

    await rowFor(page, FIRST_REVIEW).getByRole('button', { name: 'Aplicar ação' }).click();

    const dialog = page.getByRole('dialog', { name: 'Aplicar ação' });
    await dialog.getByLabel('Ação').selectOption('Remove');
    await expect(dialog).toContainText('não pode ser desfeita');
    await dialog.getByRole('button', { name: 'Confirmar ação' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Conteúdo removido.' })).toBeVisible();
    await expect(page.locator('.report')).toHaveCount(2);

    await page.goto('/');

    await expect(page.getByRole('link', { name: `Ler review: ${FIRST_REVIEW}` })).toHaveCount(0);
    await expect(page.locator('app-review-card')).toHaveCount(12);
  });

  test('suspends the author after a valid duration', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await openModeration(page);

    await rowFor(page, 'Possível divulgação sem relação com a review.').getByRole('button', {
      name: 'Aplicar ação',
    }).click();

    const dialog = page.getByRole('dialog', { name: 'Aplicar ação' });
    await dialog.getByLabel('Ação').selectOption('Suspend');
    await dialog.getByLabel('Dias de suspensão').fill('0');
    await expect(dialog.getByRole('button', { name: 'Confirmar ação' })).toBeDisabled();

    await dialog.getByLabel('Dias de suspensão').fill('7');
    await dialog.getByRole('button', { name: 'Confirmar ação' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Conta suspensa.' })).toBeVisible();
    await expect(page.locator('.report')).toHaveCount(2);
  });
});
