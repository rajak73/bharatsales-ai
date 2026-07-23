import { test, expect } from '@playwright/test';

test.describe('Role-Based Login & Routing Flow', () => {

  test('Super Admin login and routing', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Browser Error: ${msg.text()}`);
    });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for either the dashboard url OR an error message
    try {
      await page.waitForURL(/.*dashboard/, { timeout: 5000 });
    } catch (e) {
      // Find the error text and print it
      const errorDiv = page.locator('.bg-red-50');
      if (await errorDiv.isVisible()) {
        console.error('Login Error for Super Admin:', await errorDiv.textContent());
      }
      throw e;
    }

    // Check that Super Admin text is rendered in the UI (likely the sidebar)
    await expect(page.locator('text=Super Admin').first()).toBeVisible();
  });

  test('Organization Owner login and routing', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // They should see tenant specific tabs like Outlets, Team
    const nav = page.locator('nav');
    await expect(nav.locator('text=Outlets')).toBeVisible();
    await expect(nav.locator('text=Team')).toBeVisible();
  });

  test('Sales Representative login and PWA access', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'rep@bharatfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Sales Rep might be redirected to dashboard or field-pwa depending on logic
    // Let's assume they go to /dashboard or /field-pwa
    await page.waitForURL(url => url.pathname.includes('dashboard') || url.pathname.includes('field-pwa'));
    
    // Ensure they don't see super admin settings
    await expect(page.locator('text=Super Admin')).toHaveCount(0);
    // They should see Beats or Outlets
    await expect(page.locator('text=Beats').first()).toBeVisible();
  });

  test('Distributor Owner login and routing', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@saketdist.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Distributor Owner should see "Distributor" link
    await expect(page.locator('text=Distributor').first()).toBeVisible();
  });
});
