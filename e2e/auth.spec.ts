import { test, expect } from '@playwright/test';

test.describe('Authentication & Invitation Flow', () => {

  test.describe.configure({ mode: 'serial' });

  let inviteToken = '';
  let accessToken = '';
  let testEmail = `newrep-${Date.now()}@bharatfoods.com`;

  test('Login as Super Admin and invite a new user', async ({ page, request }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Browser Error: ${msg.text()}`);
    });
    // Navigate to login
    await page.goto('/login');
    
    // Fill in credentials for Super Admin
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Super Admin').first()).toBeVisible();

    // Extract access token for API calls
    await page.waitForLoadState('networkidle');
    accessToken = await page.evaluate(() => localStorage.getItem('bharatsales_token')) || '';
    expect(accessToken).toBeTruthy();

    // We bypass the UI and call the API directly using the stored token.
    const res = await request.post('http://localhost:6002/users/invites', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: { email: testEmail, role: 'Sales Representative' }
    });
    const body = await res.json();
    
    expect(body.inviteToken).toBeDefined();
    inviteToken = body.inviteToken;
    // Logout by clearing storage instead of relying on a specific UI button
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('Accept invitation with token and new password', async ({ page, request }) => {
    // The frontend UI for accepting invitations is not implemented.
    // We bypass the UI and call the API directly.
    const res = await request.post('http://localhost:6002/auth/accept-invitation', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: { token: inviteToken, newPassword: 'newSecurePass123' }
    });
    const body = await res.json();
    
    expect(body.success).toBe(true);
  });

  test('Login with newly activated user', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'newSecurePass123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Sales Representative')).toBeVisible();
  });

});
