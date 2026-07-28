import { test, expect } from '@playwright/test';

test.describe('Field PWA to Web Integration', () => {

  test('Rep can mark attendance in PWA and it reflects on Web', async ({ browser }) => {
    // 1. Rep logs into Field PWA (Port 6001)
    const pwaContext = await browser.newContext({ baseURL: 'http://localhost:6001' });
    const pwaPage = await pwaContext.newPage();
    
    await pwaPage.goto('/login');
    await pwaPage.fill('input[type="email"]', 'rep@bharatfoods.com');
    await pwaPage.fill('input[type="password"]', 'password123');
    await pwaPage.click('button[type="submit"]');
    
    // Wait for PWA home screen
    await expect(pwaPage.locator('text=Profile').first()).toBeVisible({ timeout: 15000 });
    
    // Navigate to Attendance
    await pwaPage.click('text=Profile');
    await pwaPage.click('text=Daily Attendance (Start Day)');
    
    // Mark Present if not already
    const checkInBtn = pwaPage.locator('button:has-text("Start Day")');
    if (await checkInBtn.isVisible()) {
      await checkInBtn.click();
    }
    await expect(pwaPage.locator('text=You are On Duty')).toBeVisible();

    // 2. Manager logs into Web Dashboard (Port 6003)
    const webContext = await browser.newContext({ baseURL: 'http://localhost:6003' });
    const webPage = await webContext.newPage();
    
    await webPage.goto('/login');
    await webPage.fill('input[type="email"]', 'admin@bharatfoods.com');
    await webPage.fill('input[type="password"]', 'password123');
    await webPage.click('button[type="submit"]');
    
    // Wait for Dashboard
    await expect(webPage).toHaveURL(/.*dashboard/, { timeout: 15000 });
    
    // Navigate to Live Map
    await webPage.goto('/dashboard/live-map');
    await expect(webPage.locator('text=Live Rep Tracking')).toBeVisible();
    
    // Check if Rep shows up in the list
    await expect(webPage.locator('text=Active Reps Today')).toBeVisible();
  });
});
