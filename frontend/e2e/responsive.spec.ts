import { Page, expect, test } from '@playwright/test';

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const MARIA = '10000000-0000-4000-8000-000000000001';
const PANEL_SELECTOR =
  '.feed-panel, .detail-panel, .editor-panel, .profile-panel, .notifications-panel, .moderation-panel';

async function overflow(page: Page): Promise<{ document: number; panels: number }> {
  return page.evaluate((selector) => {
    const root = document.documentElement;
    const panels = Array.from(document.querySelectorAll(selector));

    return {
      document: root.scrollWidth - root.clientWidth,
      panels: Math.max(0, ...panels.map((panel) => panel.scrollWidth - panel.clientWidth)),
    };
  }, PANEL_SELECTOR);
}

test.describe('responsive sweep', () => {
  for (const width of WIDTHS) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium', 'Viewport sweep runs once');

      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expect(page.locator('app-review-card').first()).toBeVisible();

      const postPath = await page
        .locator('app-review-card .card__link')
        .first()
        .getAttribute('href');
      expect(postPath).toMatch(/^\/posts\//);

      const routes = [
        '/',
        postPath!,
        '/new',
        `/profile/${MARIA}`,
        '/notifications',
        '/moderation',
        '/login',
      ];

      for (const route of routes) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        // Lists load asynchronously in the demo (250–450 ms); let them settle so
        // their rows are part of the measurement.
        await page.waitForTimeout(700);

        const result = await overflow(page);

        expect(result.document, `document overflow on ${route} at ${width}px`).toBeLessThanOrEqual(
          1,
        );
        expect(result.panels, `panel overflow on ${route} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
});
