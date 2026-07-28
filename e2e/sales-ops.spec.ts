import { test, expect } from '@playwright/test';

test.describe('Full Sales Operation Flow', () => {

  test.beforeEach(async ({ context }) => {
    // Grant geolocation permissions for attendance and tracking
    await context.grantPermissions(['geolocation']);
  });

  test('Sales Rep can take an order and Manager can view it in the Web App', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 28.5284, longitude: 77.2183, accuracy: 10 });

    // --- 1. Rep Logs into Field PWA ---
    await page.goto('http://localhost:6001/login');
    await page.fill('input[type="email"]', 'rep@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:6001/');

    // --- 2. Start Day ---
    await page.goto('http://localhost:6001/attendance');
    await expect(page.locator('.animate-spin').first()).not.toBeVisible({ timeout: 10000 });
    
    // Clear any previous day just in case
    const existingEndDayBtn = page.locator('button:has-text("End Day")');
    if (await existingEndDayBtn.isVisible()) {
      await existingEndDayBtn.click();
      await expect(page.locator('text=You are Off Duty')).toBeVisible();
    }
    const startDayBtn = page.locator('button:has-text("Start Day")');
    await expect(startDayBtn).toBeVisible({ timeout: 15000 });
    await startDayBtn.click();
    await expect(page.locator('text=You are On Duty')).toBeVisible({ timeout: 15000 });

    // --- 3. Visit an Outlet ---
    await page.goto('http://localhost:6001/outlets');
    const allOutletsBtn = page.locator('button:has-text("All Outlets")');
    await expect(allOutletsBtn).toBeVisible();
    await allOutletsBtn.click();

    const firstOutletCard = page.locator('.bg-white.p-4.rounded-xl').first();
    await expect(firstOutletCard).toBeVisible({ timeout: 15000 });
    await firstOutletCard.click();
    await expect(page.locator('text=Visit Status')).toBeVisible();

    // Check In
    await page.locator('button:has-text("Check In to Outlet")').click();
    await expect(page.locator('button:has-text("Check Out")')).toBeVisible({ timeout: 15000 });

    // --- 4. Add items to cart from Catalog ---
    await page.goto('http://localhost:6001/catalog');
    
    // Wait for catalog items to load
    const firstProduct = page.locator('.bg-white.p-3.rounded-xl').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    
    // Click Add to Cart
    // Wait for button to be visible inside the product card
    const addBtn = firstProduct.locator('button').first();
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();
    
    // Wait for the cart indicator to update
    await expect(page.locator('.bg-red-500.text-white').first()).toHaveText('1', { timeout: 15000 });

    // --- 5. Checkout & Place Order ---
    await page.goto('http://localhost:6001/cart');
    await expect(page.locator('text=Order Summary')).toBeVisible({ timeout: 15000 });
    
    // Place Order
    await page.locator('button:has-text("Place Order")').click();
    await expect(page.locator('text=Order Placed!')).toBeVisible({ timeout: 15000 });
    
    // Wait for the success screen to disappear
    await expect(page.locator('text=Order Placed!')).not.toBeVisible({ timeout: 15000 });

    // --- 6. Sync trigger explicitly via Profile ---
    await page.goto('http://localhost:6001/profile');
    const syncStatus = page.locator('text=Pending items in queue:');
    await expect(syncStatus).toBeVisible();
    await page.locator('button:has-text("Force Sync Now")').click();
    
    // Wait for sync to complete
    await expect(page.locator('text=Pending items in queue: 0')).toBeVisible({ timeout: 15000 });

    // --- 7. Manager verifies the order in the Web App ---
    // Log into Web App (Port 6003)
    await page.goto('http://localhost:6003/login');
    await page.fill('input[type="email"]', 'admin@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for Dashboard to load
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await expect(page.locator('nav:has-text("Orders")')).toBeVisible({ timeout: 15000 });
    
    // Navigate to Orders
    await page.goto('http://localhost:6003/dashboard/orders');
    
    // The newly created order should be listed
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    
    // Check if there is an order with status 'Hold_Stock' (as inventory isn't seeded)
    await expect(page.locator('table >> text=Hold_Stock').first()).toBeVisible({ timeout: 15000 });
    
  });
});
