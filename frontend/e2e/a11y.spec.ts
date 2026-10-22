import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

async function expectNoBlockingViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter((violation) =>
    BLOCKING_IMPACTS.has(violation.impact ?? ''),
  );

  expect(
    blocking.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(' ')),
    })),
    `axe violations on ${label}`,
  ).toEqual([]);
}

test.describe('accessibility', () => {
  test('feed, detail and editor have no critical or serious axe violations', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only audit');

    await page.goto('/');
    await expect(page.locator('app-review-card').first()).toBeVisible();
    await expectNoBlockingViolations(page, 'feed');

    await page.locator('.card__link').first().click();
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'detail');

    await page.goto('/new');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'editor');
  });

  test('login, profile, notifications and moderation have no blocking violations', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only audit');

    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'login');

    await page.goto('/profile/10000000-0000-4000-8000-000000000001');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'profile');

    await page.goto('/notifications');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'notifications');

    await page.goto('/moderation');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoBlockingViolations(page, 'moderation');
  });
});
