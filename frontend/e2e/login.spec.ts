import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('owner can log in and reach dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@gym.com');
    await page.getByLabel('Password').fill('Owner@123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('owner@gym.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('.text-red-700')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('RBAC navigation', () => {
  test('trainer does not see enquiries in nav', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('trainer@gym.com');
    await page.getByLabel('Password').fill('Trainer@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByRole('link', { name: 'Enquiries' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Members' })).toBeVisible();
  });
});
