import { expect, test } from '@playwright/test';

test.describe('keyboard journey', () => {
  test('the skip link moves focus to the main content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Keyboard journey runs once');

    await page.goto('/');
    await expect(page.locator('app-review-card').first()).toBeVisible();
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('filter, search, card, like, comments and back work without a mouse', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Keyboard journey runs once');

    await page.goto('/');
    await expect(page.locator('app-review-card').first()).toBeVisible();

    const filter = page.getByRole('button', { name: 'Filtro' });
    await filter.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'filtro' });
    await expect(dialog).toBeVisible();

    const book = dialog.getByRole('button', { name: 'Livro', exact: true });
    await book.focus();
    await expect(book).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Filtro, 1 filtro ativo' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.filter-button__badge')).toHaveText('1');

    const search = page.getByLabel('Pesquisar reviews');
    await search.focus();
    await page.keyboard.type('casa');
    await expect(search).toHaveValue('casa');
    await expect(page.locator('app-review-card')).toHaveCount(1);

    const cardLink = page.locator('app-review-card .card__link').first();
    await cardLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/posts\//);

    const like = page.locator('.like');
    const initialPressed = await like.getAttribute('aria-pressed');
    expect(initialPressed).not.toBeNull();
    await like.focus();
    await page.keyboard.press('Enter');
    await expect(like).toHaveAttribute(
      'aria-pressed',
      initialPressed === 'true' ? 'false' : 'true',
    );

    const composer = page.getByLabel('Escreva um comentário');
    await composer.focus();
    await expect(composer).toBeFocused();
    await expect(page.getByRole('heading', { name: /Comentários/ })).toBeVisible();

    const back = page.getByRole('button', { name: 'Voltar', exact: true });
    await back.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/\?.*q=casa/);
    await expect(page.getByLabel('Pesquisar reviews')).toHaveValue('casa');
  });
});
