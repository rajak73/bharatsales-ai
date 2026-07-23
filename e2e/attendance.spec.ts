import { test, expect } from '@playwright/test';

test.describe('Attendance & Geolocation Flow', () => {

  // We mock geolocation before each test in this context
  test.beforeEach(async ({ context }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
  });

  test('Sales Rep can Start Day, send Live Location, Check In, Check Out, and End Day via real PWA UI', async ({ page, context }) => {
    // 1. Mock Geolocation (matching an outlet's location in seeds)
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946, accuracy: 10 });

    // 2. Login as Rep to PWA (Port 6001)
    await page.goto('http://localhost:6001/login');
    await page.fill('input[type="email"]', 'rep@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to PWA dashboard/home
    await page.waitForURL('http://localhost:6001/');

    // 3. Start Day
    // Click on Attendance tab or directly to start day if it's on home
    // Navigate directly to avoid click timeouts if bottom nav is obscured
    await page.goto('http://localhost:6001/attendance');

    // Wait for the loading state to finish
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({ timeout: 10000 });

    // If already on duty from a previous failed test run, End Day first
    const existingEndDayBtn = page.locator('button:has-text("End Day")');
    if (await existingEndDayBtn.isVisible()) {
      await existingEndDayBtn.click();
      await expect(page.locator('text=You are Off Duty')).toBeVisible();
    }

    const startDayButton = page.locator('button:has-text("Start Day")');
    await expect(startDayButton).toBeVisible();
    await startDayButton.click();

    // Verify Day Started
    await expect(page.locator('text=You are On Duty')).toBeVisible();

    // 4. Visit an Outlet (Check In / Check Out)
    await page.goto('http://localhost:6001/outlets');
    
    // Click "All Outlets" to ensure we see them regardless of route
    const allOutletsBtn = page.locator('button:has-text("All Outlets")');
    await expect(allOutletsBtn).toBeVisible();
    await allOutletsBtn.click();

    // Wait for the first outlet card to appear
    const firstOutletCard = page.locator('.bg-white.p-4.rounded-xl').first();
    await expect(firstOutletCard).toBeVisible();
    
    // Click it to navigate to /visit with state
    await firstOutletCard.click();
    
    // Verify we are on the visit screen
    await expect(page.locator('text=Visit Status')).toBeVisible();

    // Click Check In
    const checkInButton = page.locator('button:has-text("Check In to Outlet")');
    await expect(checkInButton).toBeVisible();
    await checkInButton.click();
    
    // Verify Check In success (assuming Check Out button appears)
    const checkOutButton = page.locator('button:has-text("Check Out")');
    await expect(checkOutButton).toBeVisible();
    
    // Check Out
    await checkOutButton.click();

    // 5. End Day
    await page.goto('http://localhost:6001/attendance');
    const endDayButton = page.locator('button:has-text("End Day")');
    await expect(endDayButton).toBeVisible();
    await endDayButton.click();

    // Verify Day Ended
    await expect(page.locator('text=You are Off Duty')).toBeVisible();
  });

});
