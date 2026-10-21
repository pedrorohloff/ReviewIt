import { Page, expect, test } from '@playwright/test';

/** The demo dataset has 48 posts and the feed loads 12 per page. */
const PAGE_SIZE = 12;
const TOTAL_POSTS = 48;

async function scrollToEnd(page: Page): Promise<void> {
  await page.locator('.feed-panel').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
}

test.describe('feed shell', () => {
  test('renders the shell and the initial feed', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');

    await expect(page.locator('app-top-bar')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
    await expect(page.getByText(`${TOTAL_POSTS} reviews`)).toBeVisible();
    await expect(page.getByLabel('Pesquisar reviews')).toBeVisible();
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('app-feed-skeleton')).toHaveCount(0);

    const viewport = page.viewportSize()!;
    const searchBox = await page.getByLabel('Pesquisar reviews').boundingBox();
    expect(searchBox).not.toBeNull();
    expect(Math.abs(searchBox!.x + searchBox!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(
      1,
    );
    expect(searchBox!.width).toBeLessThanOrEqual(640);
    expect(searchBox!.x).toBeGreaterThanOrEqual(100);
    expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(viewport.width - 100);

    const avatar = page.locator('app-top-bar').getByRole('img', { name: 'Foto de Maria Rohls' });
    await expect(avatar).toBeVisible();

    const avatarBox = await avatar.boundingBox();
    expect(avatarBox).not.toBeNull();
    expect(avatarBox!.x + avatarBox!.width).toBeLessThanOrEqual(viewport.width - 8);
    expect(avatarBox!.y).toBeGreaterThanOrEqual(8);

    const panelChrome = await page.locator('.feed-panel').evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        border: styles.borderTopWidth,
        background: styles.backgroundColor,
      };
    });
    expect(panelChrome.border).toBe('0px');
    expect(panelChrome.background).toBe('rgba(0, 0, 0, 0)');
  });

  test('loads the next pages while scrolling to the end', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await scrollToEnd(page);
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE * 2);

    await scrollToEnd(page);
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE * 3);

    await scrollToEnd(page);
    await expect(page.locator('app-review-card')).toHaveCount(TOTAL_POSTS);

    await expect(page.locator('app-feed-footer')).toBeVisible();
    await expect(page.locator('.feed-more')).toHaveCount(0);
  });

  test('searches on the server and recovers from the empty state', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    await page.getByLabel('Pesquisar reviews').fill('zzzz');

    await expect(page.locator('app-review-card')).toHaveCount(0);
    await expect(page.locator('app-empty-state')).toBeVisible();
    await expect(page.getByText('Seu próximo favorito está em outro filtro.')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar busca e filtros' }).click();

    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
    await expect(page.getByLabel('Pesquisar reviews')).toHaveValue('');
  });

  test('filters by type and genre and closes with Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    const filterButton = page.getByRole('button', { name: 'Filtro' });
    await filterButton.click();
    await expect(page.getByRole('dialog', { name: 'filtro' })).toBeVisible();

    await page.getByRole('button', { name: 'Livro', exact: true }).click();
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
    await expect(page.getByText('1 filtro ativo')).toBeVisible();

    await page.getByRole('button', { name: 'Drama', exact: true }).click();
    await expect(page.locator('app-review-card')).toHaveCount(3);
    await expect(page.getByText('2 filtros ativos')).toBeVisible();

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

  test('hydrates filters from a deep link and ignores invalid values', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');

    await page.goto('/?type=Book&genre=Drama&sort=popular');
    await expect(page.locator('app-review-card')).toHaveCount(3);
    await expect(
      page.getByRole('button', { name: 'Filtro, 2 filtros ativos' }),
    ).toBeVisible();

    await page.goto('/?type=Banana&genre=Aventura&sort=aleatorio');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
    await expect(page.getByRole('button', { name: 'Filtro', exact: true })).toBeVisible();
  });

  test('keeps the custom rail in sync with the panel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only assertion');
    await page.goto('/');
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

    const panel = page.locator('.feed-panel');
    const thumb = page.locator('app-scroll-rail .rail__thumb');
    const viewport = page.viewportSize()!;

    const railBox = await page.locator('app-scroll-rail').boundingBox();
    expect(railBox).not.toBeNull();
    expect(railBox!.x + railBox!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(railBox!.y).toBeLessThanOrEqual(1);
    expect(railBox!.height).toBeGreaterThanOrEqual(viewport.height - 1);

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
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);

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
