import { expect, test } from '@playwright/test';

test.describe('resilience and motion preferences', () => {
  test('shows the offline banner while disconnected and hides it on reconnect', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await expect(page.locator('app-review-card').first()).toBeVisible();

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const banner = page.locator('app-offline-banner .offline');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Você está sem conexão');

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    await expect(banner).toHaveCount(0);
  });

  test('honors reduced motion and still auto-loads the next page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    await expect(page.locator('app-review-card')).toHaveCount(12);
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);

    const card = page.locator('app-review-card .card').first();
    const before = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        transitionDuration: style.transitionDuration,
        transform: style.transform,
        boxShadow: style.boxShadow,
      };
    });

    // The global reduced-motion rule caps durations at 0.01ms, so the card
    // transition is effectively disabled even if it is not exactly 0s.
    expect(parseFloat(before.transitionDuration)).toBeLessThanOrEqual(0.00001);
    expect(before.transform).toBe('none');

    await card.hover();

    const after = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return { transform: style.transform, boxShadow: style.boxShadow };
    });

    expect(after.transform).toBe('none');
    expect(after.boxShadow).toBe(before.boxShadow);

    await page.locator('.feed-panel').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(page.locator('app-review-card')).toHaveCount(24);
  });

  test('renders the route error state and retries the failed navigation', async ({ page }) => {
    await page.goto('/error?retry=%2Fmoderation');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Não foi possível abrir esta página.' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page).toHaveURL(/\/moderation$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Moderação' })).toBeVisible();
  });
});
