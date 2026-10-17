import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8091';

test.describe('Defect regression phase 3', () => {
  test('REG-03: short password should show an 8-character minimum, without a misleading invalid-character message', async ({ page }) => {
    test.fail(true, 'Issue #1: conflicting password rules on sign-up');

    await page.goto('http://localhost:4200/auth/register');
    await page.locator('#first_name').fill('QA');
    await page.locator('#last_name').fill('Short');
    await page.locator('#dob').fill('2000-01-01');
    await page.locator('#street').fill('Main');
    await page.locator('#postal_code').fill('12345');
    await page.locator('#city').fill('Testville');
    await page.locator('#state').fill('SP');
    await page.locator('#phone').fill('1234567');
    await page.locator('#email').fill(`qa-short-${Date.now()}@example.com`);
    await page.locator('#password').fill('1234');

    const message = page.locator('text=/at least|minimum|8 character/i');
    await expect(message).toBeVisible();
    await expect(page.locator('#password')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('API-06: phone validation should mention the minimum-length rule when a 6-digit value is sent', async ({ request }) => {
    test.fail(true, 'Issue #8: phone validation error message does not name the correct rule');

    const login = await request.post(`${API_BASE}/users/login`, {
      data: {
        email: 'customer@practicesoftwaretesting.com',
        password: 'welcome01',
      },
    });

    expect(login.status()).toBe(200);
    const auth = await login.json();
    const payload = auth.access_token;

    const me = await request.get(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${payload}` },
    });
    expect(me.status()).toBe(200);
    const user = await me.json();

    const patch = await request.patch(`${API_BASE}/users/${user.id}`, {
      headers: { Authorization: `Bearer ${payload}` },
      data: { phone: '12345' },
    });

    expect(patch.status()).toBe(422);
    const body = await patch.json();
    expect(JSON.stringify(body)).toContain('minimum');
  });
});
