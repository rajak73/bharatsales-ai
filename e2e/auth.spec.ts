import { test, expect } from '@playwright/test';

test.describe('Authentication & Invitation Flow', () => {

  test.describe.configure({ mode: 'serial' });

  let inviteToken = '';

  test('Login as Super Admin and invite a new user', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Fill in credentials for Super Admin
    await page.fill('input[type="email"]', 'superadmin@bharatsales.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Super Admin')).toBeVisible();

    // Intercept the API response to get the inviteToken
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/users/invites') && response.status() === 201
    );

    // Navigate to Users page and invite
    await page.goto('/dashboard/users');
    await page.click('button:has-text("Invite User")');
    
    // Fill invite form
    await page.fill('input[name="email"]', 'newrep@bharatfoods.com');
    await page.selectOption('select[name="role"]', 'Sales Representative');
    await page.click('button[type="submit"]:has-text("Send Invite")');

    const response = await responsePromise;
    const body = await response.json();
    
    expect(body.inviteToken).toBeDefined();
    inviteToken = body.inviteToken;

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Accept invitation with token and new password', async ({ page, request }) => {
    // Normally, the user clicks a link in their email: /accept-invitation?token=XYZ
    await page.goto(`/accept-invitation?token=${inviteToken}`);
    
    // Fill new password
    await page.fill('input[name="password"]', 'newSecurePass123');
    await page.fill('input[name="confirmPassword"]', 'newSecurePass123');
    
    await page.click('button[type="submit"]');
    
    // Expect success message and redirect to login
    await expect(page.locator('text=Invitation accepted')).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  test('Login with newly activated user', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'newrep@bharatfoods.com');
    await page.fill('input[type="password"]', 'newSecurePass123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Sales Representative')).toBeVisible();
  });

});
