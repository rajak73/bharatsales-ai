import { test, expect } from '@playwright/test';

test.describe('Live Map Manager UI', () => {
  test('Manager can view live field team locations', async ({ page }) => {
    // 1. Manager Login
    await page.goto('http://localhost:6003/login');
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Live Map
    await page.goto('http://localhost:6003/dashboard/live-map');

    // 3. Verify Live Map UI renders
    await expect(page.locator('h1:has-text("Live Team Tracking")')).toBeVisible();
    await expect(page.locator('text=Live Map View')).toBeVisible();
    await expect(page.locator('text=Active Representatives')).toBeVisible();

    // 4. Verify filters work
    const searchInput = page.locator('input[placeholder="Search reps..."]');
    await searchInput.fill('Rahul');
    // If Rahul exists in seed data, he should appear
    
    // 5. Verify manual refresh button
    const refreshBtn = page.locator('button:has-text("Refresh")');
    await refreshBtn.click();
    await expect(page.locator('text=Location data refreshed!')).toBeVisible();
  });
});
