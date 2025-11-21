import { test, expect } from '@playwright/test';

test.describe('Trace forensic flow', () => {
  test('renders trace explorer shell', async ({ page }) => {
    await page.goto('/traces');
    await expect(page.getByRole('heading', { name: 'Trace explorer' })).toBeVisible();
    await expect(page.getByPlaceholder('Search workflow…')).toBeVisible();
  });

  test('dashboard links to explorer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('link', { name: /Open trace explorer/ }).click();
    await expect(page).toHaveURL(/\/traces$/);
  });
});
