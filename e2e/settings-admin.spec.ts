import { test, expect } from '@playwright/test';

test.describe('Settings & Admin Flow', () => {

  test('Organization Admin can view and update settings', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    // 3. Navigate to Settings
    await page.goto('/dashboard/settings');

    // 4. Check UI elements
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    await expect(page.locator('text=Company Profile').first()).toBeVisible();
    await expect(page.locator('text=Attendance & Geofence').first()).toBeVisible();

    // 5. Interact and Save
    await page.click('button:has-text("💾 Save Changes")');

    // 6. Verify Success Message
    await expect(page.locator('text=Settings saved successfully!')).toBeVisible({ timeout: 5000 });
  });

  test('Super Admin can access Super Admin Console', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Navigate to super admin (correct route)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await page.locator('text=Super Admin').first().click();

    // 3. Check UI elements
    await expect(page.locator('h1:has-text("Super Admin Console")')).toBeVisible();
    await expect(page.locator('text=Organization Name')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Plan')).toBeVisible();
  });
});
