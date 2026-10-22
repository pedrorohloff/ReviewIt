import { expect, test } from '@playwright/test';

test.describe('notifications', () => {
  test('marks notifications as read and keeps it after a reload', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Desktop-only flow');

    await page.goto('/notifications');
    await expect(page.getByRole('heading', { level: 1, name: 'Notificações' })).toBeVisible();
    await expect(page.locator('.notif')).toHaveCount(10);
    await expect(page.locator('.notif--unread')).toHaveCount(8);

    await page.locator('.notif').first().getByRole('button', { name: /Marcar como lida/ }).click();

    await expect(page.locator('.notif--unread')).toHaveCount(7);

    await page.reload();
    await expect(page.locator('.notif')).toHaveCount(10);
    await expect(page.locator('.notif--unread')).toHaveCount(7);

    await page.getByRole('button', { name: 'Carregar mais notificações' }).click();
    await expect(page.locator('.notif')).toHaveCount(14);

    await page.locator('.notif__post').first().click();
    await expect(page).toHaveURL(/\/posts\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
