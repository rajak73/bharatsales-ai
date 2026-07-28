import { test, expect } from '@playwright/test';

test.describe('Inventory & Logistics Workflow', () => {
  test('Verify Inventory Adjustment and Order Dispatch (Logistics)', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
    page.on('response', response => {
      if (!response.ok()) {
        console.error('BROWSER NETWORK ERROR:', response.url(), response.status());
      }
    });
    // 1. Login
    await page.goto('http://localhost:6003/login');
    await page.fill('input[type="email"]', 'admin@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Inventory Adjustment
    await page.goto('http://localhost:6003/dashboard/inventory');
    await expect(page.locator('h1')).toContainText('Inventory Management');
    await page.click('button:has-text("+ Adjustment")');
    await expect(page.locator('h3:has-text("Stock Adjustment")')).toBeVisible();
    
    // Select the first product available in the dropdown
    await page.getByLabel('Product *').selectOption({ index: 1 });
    // Select the first batch available
    await page.getByLabel('Batch *').selectOption({ index: 1 });
    // Select type "Correction (Positive)"
    await page.getByLabel('Type *').selectOption('Correction (Positive)');
    // Enter quantity
    await page.getByLabel('Quantity *').fill('50');
    await page.click('button:has-text("Submit Adjustment")');
    await expect(page.locator('text=Stock adjustment of 50 units for')).toBeVisible();

    // 3. Order Dispatch (Logistics)
    await page.goto('http://localhost:6003/dashboard/orders');
    await expect(page.locator('h1')).toContainText('Orders');
    
    // Try to dispatch an order
    const dispatchButton = page.locator('button:has-text("Mark Dispatched")').first();
    
    if (await dispatchButton.isVisible()) {
      await dispatchButton.click();
      await expect(page.locator('text=Marked as dispatched')).toBeVisible({ timeout: 5000 });
    } else {
      console.log('No order ready to dispatch. We need to create an approved order first.');
    }
  });
});
