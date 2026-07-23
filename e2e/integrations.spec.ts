import { test, expect } from '@playwright/test';

test.describe('Integrations Flow UI', () => {
  test('Admin can view and configure integrations', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:6003/login');
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Integrations
    await page.goto('http://localhost:6003/dashboard/integrations');

    // 3. Verify Integrations UI renders
    await expect(page.locator('h1:has-text("Integrations")')).toBeVisible();
    
    // Wait for loading to finish
    await page.waitForSelector('.animate-spin', { state: 'hidden' });

    await expect(page.locator('text=Tally ERP 9')).toBeVisible();

    // 4. Test Configure Action
    await page.locator('button:has-text("Configure")').first().click();
    await expect(page.locator('text=Configuration for')).toBeVisible();
  });
});
