import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow UI', () => {
  test('Company Admin can complete the onboarding wizard', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:6003/login');
    // Using an admin who hasn't completed onboarding, or just check the wizard renders
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 2. Navigate to Onboarding
    await page.goto('http://localhost:6003/onboarding');

    // 3. Verify Step 1 renders
    await expect(page.locator('h2:has-text("Company Profile")')).toBeVisible({ timeout: 15000 });

    // Fill form Step 1
    await page.fill('input[placeholder="Your Company Pvt Ltd"]', 'Bharat Foods Ltd');
    await page.click('button:has-text("Next →")');

    // Verify Step 2
    await expect(page.locator('h2:has-text("Fiscal & Tax Setup")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")');

    // Click Next until Step 8
    await expect(page.locator('h2:has-text("Working Policies")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")'); // to step 4
    await expect(page.locator('h2:has-text("Sales Hierarchy")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")'); // to step 5
    await expect(page.locator('h2:has-text("User Setup")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")'); // to step 6
    await expect(page.locator('h2:has-text("Product Import")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")'); // to step 7
    await expect(page.locator('h2:has-text("Channel Setup")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Next →")'); // to step 8

    // Verify Step 8
    await expect(page.locator('h2:has-text("Go Live")')).toBeVisible({ timeout: 15000 });
    await page.click('button:has-text("Activate & Go Live")');

    // Verify success
    await expect(page.locator('text=Organization activated successfully!')).toBeVisible({ timeout: 15000 });
  });
});
