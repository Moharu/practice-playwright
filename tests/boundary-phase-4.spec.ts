import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8091';

const passwordCases = [
  { label: 'missing uppercase', value: 'welcome01!' },
  { label: 'missing lowercase', value: 'WELCOME01!' },
  { label: 'missing number', value: 'WelcomeOne!' },
  { label: 'missing special', value: 'Welcome01' },
];

const dobCases = [
  { label: '17 years old', value: '2009-10-18', valid: false },
  {
    label: 'exactly 18 years old',
    value: '2008-10-18',
    valid: true,
    knownMismatch: 'The API rejects a customer on their 18th birthday.',
  },
  { label: '75 years old', value: '1951-10-18', valid: true },
  { label: '76 years old', value: '1950-10-18', valid: false },
];

const phoneCases = [
  { label: '6 digits', value: '123456', valid: false },
  { label: '7 digits', value: '1234567', valid: true },
  { label: '24 digits', value: '123456789012345678901234', valid: true },
  { label: '25 digits', value: '1234567890123456789012345', valid: false },
];

test.describe('Boundary data-driven phase 4', () => {
  for (const testCase of passwordCases) {
    test(`REG-04: password pattern rejected when ${testCase.label}`, async ({ page }) => {
      await page.goto('http://localhost:4200/auth/register');

      await page.locator('#first_name').fill('QA');
      await page.locator('#last_name').fill('Boundary');
      await page.locator('#dob').fill('2000-01-01');
      await page.locator('#street').fill('Main');
      await page.locator('#postal_code').fill('12345');
      await page.locator('#city').fill('Testville');
      await page.locator('#state').fill('SP');
      await page.locator('#phone').fill('1234567');
      await page.locator('#email').fill(`qa-reg-04-${Date.now()}-${testCase.label.replace(/\s+/g, '-') }@example.com`);
      await page.locator('#password').fill(testCase.value);

      await page.getByRole('button', { name: /register|sign up/i }).click();

      await expect(page.locator('body')).toContainText(/invalid|password|requirements|uppercase|lowercase|number|special/i);
    });
  }

  for (const testCase of dobCases) {
    test(`REG-11: dob boundary ${testCase.label}`, async ({ request }) => {
      if ('knownMismatch' in testCase) {
        test.fail(true, testCase.knownMismatch);
      }

      if (!testCase.valid) {
        test.fail(true, 'Known mismatch: DOB boundaries currently accept 17- and 76-year-old registrations.');
      }

      const email = `qa-dob-${Date.now()}-${testCase.label.replace(/\s+/g, '-')}@example.com`;
      const password = `A9!StrongPass${Date.now()}`;
      const payload = {
        first_name: 'QA',
        last_name: 'Dob',
        email,
        password,
        phone: '1234567',
        address: {
          street: 'Main',
          postal_code: '12345',
          city: 'Testville',
          state: 'CA',
          country: 'US',
        },
        dob: testCase.value,
      };

      const response = await request.post(`${API_BASE}/users/register`, { data: payload });
      if (testCase.valid) {
        expect(response.status()).toBe(201);
      } else {
        expect(response.status()).toBe(400);
      }
    });
  }

  for (const testCase of phoneCases) {
    test(`PROF-02 / API-05: phone boundary ${testCase.label}`, async ({ request }) => {
      const email = `qa-phone-boundary-${Date.now()}-${testCase.label.replace(/\s+/g, '-')}@example.com`;
      const password = `A9!StrongPass${Date.now()}`;
      const register = await request.post(`${API_BASE}/users/register`, {
        data: {
          first_name: 'QA',
          last_name: 'Phone',
          email,
          password,
          phone: '1234567',
          address: {
            street: 'Main',
            postal_code: '12345',
            city: 'Testville',
            state: 'CA',
            country: 'US',
          },
          dob: '2000-01-01',
        },
      });

      expect(register.status()).toBe(201);

      const login = await request.post(`${API_BASE}/users/login`, {
        data: { email, password },
      });
      expect(login.status()).toBe(200);
      const loginBody = await login.json();

      const me = await request.get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${loginBody.access_token}` },
      });
      expect(me.status()).toBe(200);
      const user = await me.json();

      const patch = await request.patch(`${API_BASE}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${loginBody.access_token}` },
        data: {
          first_name: 'QA',
          last_name: 'Phone',
          email,
          password,
          phone: testCase.value,
        },
      });

      if (testCase.valid) {
        expect(patch.status()).toBe(200);
      } else {
        expect(patch.status()).toBe(422);
      }
    });
  }
});
