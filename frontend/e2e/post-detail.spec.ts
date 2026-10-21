import { Page, expect, test } from '@playwright/test';

/** The demo dataset has 48 posts and the feed loads 12 per page. */
const PAGE_SIZE = 12;

/** Clicks a card that is fully visible at the current scroll, without scrolling. */
async function clickVisibleCard(page: Page): Promise<number> {
  return page.evaluate(() => {
    const panel = document.querySelector('.feed-panel') as HTMLElement;
    const rect = panel.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    ) as HTMLElement | null;
    const link = target?.closest('app-review-card')?.querySelector('.card__link') as
      | HTMLElement
      | null;

    link?.click();
    return panel.scrollTop;
  });
}

test.describe('post detail', () => {
  test('opens a review and restores the feed scroll on back', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await page.locator('.feed-panel').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE * 2);

    const panel = page.locator('.feed-panel');
    await panel.evaluate((element) => {
      element.scrollTop = 900;
    });

    const before = await clickVisibleCard(page);
    expect(before).toBeGreaterThan(0);

    await expect(page.locator('.detail-panel')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Reviews' }),
    ).toHaveCount(0);
    await expect(page.locator('.review__body')).not.toBeEmpty();

    const title = await page.locator('h1').textContent();
    expect(title?.trim().length).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Voltar' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE * 2);

    await expect
      .poll(async () => panel.evaluate((element) => element.scrollTop))
      .toBeGreaterThanOrEqual(before - 50);

    const after = await panel.evaluate((element) => element.scrollTop);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(50);
  });

  test('shows a friendly state for an unknown review', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/posts/00000000-0000-4000-8000-000000000000');

    await expect(page.getByText('Review não encontrada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
  });

  test('adds, likes and removes a comment', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await clickVisibleCard(page);
    await expect(page.locator('.detail-panel')).toBeVisible();
    await expect(page.locator('#comments-title')).toBeVisible();

    const heading = page.locator('#comments-title');
    const initial = Number((await heading.textContent())?.match(/\d+/)?.[0] ?? 0);
    const body = 'Comentário criado pelo teste e2e.';

    await page.getByLabel('Escreva um comentário').fill(body);
    await page.getByRole('button', { name: 'Comentar', exact: true }).click();

    await expect(page.getByText(body)).toBeVisible();
    await expect(heading).toHaveText(`Comentários (${initial + 1})`);

    const item = page.locator('app-comment-item', { hasText: body });
    const like = item.getByRole('button', { name: /curtida/ });

    await expect(like).toHaveAttribute('aria-pressed', 'false');
    await like.click();
    await expect(like).toHaveAttribute('aria-pressed', 'true');

    await item.getByRole('button', { name: 'Remover', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Remover comentário' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Remover' }).click();

    await expect(page.getByText(body)).toHaveCount(0);
    await expect(heading).toHaveText(`Comentários (${initial})`);
  });

  test('reports a review after confirming a reason', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await clickVisibleCard(page);
    await expect(page.locator('.detail-panel')).toBeVisible();

    const trigger = page.getByRole('button', { name: 'Denunciar review' });
    const dialog = page.getByRole('dialog', { name: 'Denunciar review' });

    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    await trigger.click();
    await expect(dialog).toBeVisible();

    const submit = dialog.getByRole('button', { name: 'Enviar denúncia' });
    await expect(submit).toBeDisabled();

    await dialog.getByLabel('Motivo').fill('Conteúdo ofensivo');
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('Denúncia enviada. Obrigado por avisar.')).toBeVisible();
  });

  test('opens the comments from the card counter', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await page.locator('app-review-card .stat--link').first().click();
    await expect(page.locator('.detail-panel')).toBeVisible();
    await expect(page.locator('#comments-title')).toBeVisible();

    const panel = page.locator('.detail-panel');
    await expect.poll(async () => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    const section = await page.locator('#comments').boundingBox();
    const viewport = await panel.boundingBox();
    expect(section).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(section!.y - viewport!.y).toBeLessThan(40);
  });

  test('keeps the comment composer disabled while empty', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await clickVisibleCard(page);
    await expect(page.locator('.detail-panel')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Comentar', exact: true })).toBeDisabled();

    await page.getByLabel('Escreva um comentário').fill('   ');
    await expect(page.getByRole('button', { name: 'Comentar', exact: true })).toBeDisabled();
  });

  test('keeps the review body readable and preserves line breaks', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await clickVisibleCard(page);
    await expect(page.locator('.detail-panel')).toBeVisible();

    const body = await page.locator('.review__body').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        whiteSpace: styles.whiteSpace,
        lineHeight: parseFloat(styles.lineHeight),
        fontSize: parseFloat(styles.fontSize),
        width: element.getBoundingClientRect().width,
      };
    });

    expect(body.whiteSpace).toBe('pre-wrap');
    expect(body.lineHeight / body.fontSize).toBeGreaterThanOrEqual(1.6);
    expect(body.width).toBeLessThanOrEqual(68 * body.fontSize + 1);
  });
});
