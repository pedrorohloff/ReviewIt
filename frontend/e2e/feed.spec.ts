import { expect, test } from '@playwright/test';

test.describe('feed shell', () => {
  test('renders the shell and the initial feed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');

    await expect(page.locator('app-top-bar')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
    await expect(page.getByLabel('Pesquisar reviews')).toBeVisible();
    await expect(page.locator('app-review-card')).toHaveCount(8);
    await expect(page.locator('app-feed-skeleton')).toHaveCount(0);
  });

  test('searches locally and recovers from the empty state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(8);

    await page.getByLabel('Pesquisar reviews').fill('zzzz');

    await expect(page.locator('app-review-card')).toHaveCount(0);
    await expect(page.locator('app-empty-state')).toBeVisible();
    await expect(page.getByText('Seu próximo favorito está em outro filtro.')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar busca e filtros' }).click();

    await expect(page.locator('app-review-card')).toHaveCount(8);
    await expect(page.getByLabel('Pesquisar reviews')).toHaveValue('');
  });

  test('filters by type and closes with Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(8);

    const filterButton = page.getByRole('button', { name: 'Filtro' });
    await filterButton.click();
    await expect(page.getByRole('dialog', { name: 'filtro' })).toBeVisible();

    await page.getByRole('button', { name: 'Livro', exact: true }).click();
    await expect(page.locator('app-review-card')).toHaveCount(2);
    await expect(page.getByText('1 filtro ativo')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'filtro' })).toHaveCount(0);
    await expect(filterButton).toBeFocused();
  });

  test('renders a shell-preserving 404 and returns to the feed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/pagina-que-nao-existe');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Essa página saiu para ler.' }),
    ).toBeVisible();
    await expect(page.locator('app-top-bar')).toBeVisible();

    await page.getByRole('link', { name: 'Voltar para o feed' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
  });

  test('keeps the custom rail in sync with the panel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(8);

    const panel = page.locator('.feed-panel');
    const thumb = page.locator('app-scroll-rail .rail__thumb');

    const before = await thumb.boundingBox();
    await panel.evaluate((element) => {
      element.scrollTop = 500;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect
      .poll(async () => (await thumb.boundingBox())?.y ?? 0)
      .toBeGreaterThan(before?.y ?? 0);

    const heights = await panel.evaluate((element) => ({
      client: element.clientHeight,
      scroll: element.scrollHeight,
    }));
    expect(heights.scroll).toBeGreaterThan(heights.client);
  });
});

test.describe('mobile shell', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('fits the viewport and opens the filter as a bottom sheet', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(8);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    await page.getByRole('button', { name: 'Filtro' }).click();
    const dialog = page.getByRole('dialog', { name: 'filtro' });
    await expect(dialog).toBeVisible();

    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  });
});
