import { Page, expect, test } from '@playwright/test';

/** The demo dataset has 48 posts and the feed loads 12 per page. */
const PAGE_SIZE = 12;

const BODY =
  'Uma review escrita pelo teste e2e, com detalhes suficientes para passar da validação mínima.';

async function waitForFeed(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
}

async function fillEditor(page: Page, title: string): Promise<void> {
  await page.getByLabel('Título').fill(title);
  await page.getByLabel('Tipo').selectOption({ label: 'Livro' });
  await page.getByLabel('Gênero').selectOption({ label: 'Drama' });
  await page.getByLabel('Sua review').fill(BODY);
}

async function publish(page: Page, title: string): Promise<void> {
  await page.goto('/new');
  await expect(page.getByRole('heading', { level: 1, name: 'Nova review' })).toBeVisible();

  await fillEditor(page, title);
  await page.getByRole('button', { name: 'Publicar' }).click();

  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page).toHaveURL(/\/posts\/[0-9a-f-]{36}$/);
}

test.describe('post editor', () => {
  test('creates a review from the feed and opens it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await waitForFeed(page);
    await page.getByRole('link', { name: 'Nova review' }).click();

    await expect(page).toHaveURL('/new');
    await expect(page.getByRole('heading', { level: 1, name: 'Nova review' })).toBeVisible();

    await page.getByRole('button', { name: 'Publicar' }).click();
    await expect(page.getByText('Informe um título.')).toBeVisible();
    await expect(page.getByText('Selecione o tipo.')).toBeVisible();
    await expect(page).toHaveURL('/new');

    const title = 'Review criada no e2e';
    await fillEditor(page, title);

    // The live preview mirrors the form.
    await expect(page.locator('app-review-preview h2')).toHaveText(title);
    await expect(page.locator('app-review-preview')).toContainText('Livro');
    await expect(page.locator('app-review-preview')).toContainText(BODY);

    await page.getByRole('button', { name: 'Publicar' }).click();

    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.locator('.review__body')).toHaveText(BODY);
    await expect(page).toHaveURL(/\/posts\/[0-9a-f-]{36}$/);
  });

  test('edits the review and refreshes the feed on return', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    const original = 'Review que será editada';
    const edited = 'Review editada pelo e2e';

    await publish(page, original);

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: `Ler review: ${original}` })).toBeVisible();

    await page.getByRole('link', { name: `Ler review: ${original}` }).click();
    await expect(page.getByRole('heading', { level: 1, name: original })).toBeVisible();

    await page.getByRole('link', { name: 'Editar review' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Editar review' })).toBeVisible();
    await expect(page.getByLabel('Título')).toHaveValue(original);

    await page.getByLabel('Título').fill(edited);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByRole('heading', { level: 1, name: edited })).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: `Ler review: ${edited}` })).toBeVisible();
    await expect(page.getByRole('link', { name: `Ler review: ${original}` })).toHaveCount(0);
  });

  test('deletes the review after the confirmation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    const title = 'Review que será excluída';
    await publish(page, title);

    await page.getByRole('link', { name: 'Editar review' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Editar review' })).toBeVisible();

    await page.getByRole('button', { name: 'Excluir review' }).click();
    const dialog = page.getByRole('dialog', { name: 'Excluir review' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Essa ação não pode ser desfeita.');

    await dialog.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Review excluída.')).toBeVisible();
    await expect(page.locator('app-review-card')).toHaveCount(PAGE_SIZE);
    await expect(page.getByRole('link', { name: `Ler review: ${title}` })).toHaveCount(0);
  });

  test('blocks the editor for someone else review', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await waitForFeed(page);

    const href = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('app-review-card'));
      const foreign = cards.find((card) => !card.textContent?.includes('Maria Rohls'));
      return (foreign?.querySelector('.card__link') as HTMLAnchorElement | null)?.getAttribute(
        'href',
      );
    });

    expect(href).toBeTruthy();
    await page.goto(`${href}/edit`);

    await expect(page.getByText('Você não pode editar esta review')).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
  });

  test('asks before discarding unsaved changes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/new');
    await page.getByLabel('Título').fill('Rascunho abandonado');

    await page.getByRole('button', { name: 'Voltar' }).click();
    const dialog = page.getByRole('dialog', { name: 'Descartar alterações?' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Continuar editando' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL('/new');
    await expect(page.getByLabel('Título')).toHaveValue('Rascunho abandonado');

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Descartar' }).click();

    await expect(page).toHaveURL('/');
  });
});
