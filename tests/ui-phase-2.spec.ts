import { test, expect } from '@playwright/test';

test.describe('UI phase 2', () => {
  test('AUTH-01: login with valid credentials redirects to account @smoke', async ({ page }) => {
    await page.goto('http://localhost:4200/auth/login');

    await page.getByLabel('Email address *').fill('customer@practicesoftwaretesting.com');
    await page.getByLabel('Password *').fill('welcome01');
    await page.getByRole('button', { name: 'Login' }).click();

    await page.waitForURL(/\/account/);
    await expect(page).toHaveURL(/\/account/);
  });

  test('SHOP-01: catalog loads and opens product detail @smoke', async ({ page }) => {
    await page.goto('http://localhost:4200/');

    await expect(page.getByRole('heading', { name: 'Practice Software Testing - Toolshop' })).toBeVisible();
    const productLink = page.getByRole('link', { name: /Combination Pliers/i });
    await expect(productLink).toBeVisible();
    await productLink.click();

    await page.waitForURL(/\/product\//);
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole('heading', { name: /Combination Pliers/i })).toBeVisible();
  });
});
