import { test, expect } from '@playwright/test';
import { API_BASE, authHeader, buildUser, createUser, dobYearsAgo, knownDefect, uniqueEmail } from './helpers/api';
import { fillRegistrationForm, submitRegistration } from './helpers/ui';

// REG-04: each password misses exactly one rule (8+ characters, upper case, lower case, number, symbol).
const passwordCases = [
  { label: 'missing uppercase', value: 'welcome01!' },
  { label: 'missing lowercase', value: 'WELCOME01!' },
  { label: 'missing number', value: 'WelcomeOne!' },
  { label: 'missing special', value: 'Welcome01' },
];

// REG-11: the OpenAPI schema says the date of birth must be between 18 and 75 years ago.
// A two-day margin keeps each case clear of the exact birthday and of time zones, and the dates
// are computed from today, so the cases do not drift as days pass.
const MARGIN_DAYS = 2;
const dobCases: { label: string; value: string; valid: boolean; defect?: string }[] = [
  { label: 'just under 18', value: dobYearsAgo(18, -MARGIN_DAYS), valid: false },
  { label: 'just over 18', value: dobYearsAgo(18, MARGIN_DAYS), valid: true },
  { label: 'just under 75', value: dobYearsAgo(75, -MARGIN_DAYS), valid: true },
  {
    label: 'just over 75',
    value: dobYearsAgo(75, MARGIN_DAYS),
    valid: false,
    // Confirmed in session 02: 75, 76 years and older dates up to at least 76 years and 2 days are
    // accepted. Update the issue number once the issue is filed.
    defect: 'Issue #9: the API accepts dates of birth older than 75 years',
  },
];

// PROF-02 / API-05: observed in session 02 on PATCH /users/{id}.
const phoneCases = [
  { label: '6 digits', value: '123456', valid: false },
  { label: '7 digits', value: '1234567', valid: true },
  { label: '24 digits', value: '123456789012345678901234', valid: true },
  { label: '25 digits', value: '1234567890123456789012345', valid: false },
  { label: 'formatted number', value: '+55 (51) 1234-5678', valid: true },
];

test.describe('Boundary data-driven phase 4', () => {
  // Positive control: a valid registration through the UI creates an account. It proves the form
  // fill works, so the REG-04 results below are meaningful (they could otherwise pass because of
  // some unrelated problem with the form).
  test('REG-01: a valid registration through the UI creates an account @smoke', async ({ page, request }) => {
    const user = buildUser({ email: uniqueEmail('reg-01') });

    await fillRegistrationForm(page, user);
    await submitRegistration(page);

    await expect(page).toHaveURL(/\/auth\/login/); // registration redirects to the login page
    const login = await request.post(`${API_BASE}/users/login`, {
      data: { email: user.email, password: user.password },
    });
    expect(login.status()).toBe(200);
  });

  for (const testCase of passwordCases) {
    test(`REG-04: password ${testCase.label} does not create an account`, async ({ page, request }) => {
      const user = buildUser({ email: uniqueEmail(`reg-04-${testCase.label}`), password: testCase.value });

      await fillRegistrationForm(page, user);
      await submitRegistration(page);
      await page.waitForLoadState('networkidle');

      // Still on the registration page, and no account exists for these credentials.
      await expect(page).toHaveURL(/\/auth\/register/);
      const login = await request.post(`${API_BASE}/users/login`, {
        data: { email: user.email, password: user.password },
      });
      expect(login.status(), 'login must fail because the account should not exist').toBe(401);
    });
  }

  // Observed in session 02: the API rejects an out-of-range date with 422 and a body naming `dob`
  // ("Customer must be 18 years old." / "Customer must be younger than 75 years old."). The OpenAPI
  // spec lists only 400 for registration, so the spec is out of date here. Asserting on the `dob`
  // key matters: a rejection for any other reason (for example a bad password) must not pass.
  for (const testCase of dobCases) {
    test(`REG-11 (API): date of birth ${testCase.label} is ${testCase.valid ? 'accepted' : 'rejected'}`, async ({ request }) => {
      if (testCase.defect) {
        knownDefect(testCase.defect);
      }

      const user = buildUser({
        email: uniqueEmail(`reg-11-${testCase.label}`),
        dob: testCase.value,
      });

      const response = await request.post(`${API_BASE}/users/register`, { data: user });

      if (testCase.valid) {
        expect(response.status(), `dob ${testCase.value} should be accepted`).toBe(201);
      } else {
        expect(response.status(), `dob ${testCase.value} should be rejected`).toBe(422);
        expect(await response.json()).toHaveProperty('dob');
      }
    });
  }

  for (const testCase of phoneCases) {
    test(`PROF-02 / API-05: profile phone ${testCase.label}`, async ({ request }) => {
      const { token, id } = await createUser(request);

      const patch = await request.patch(`${API_BASE}/users/${id}`, {
        headers: authHeader(token),
        data: { phone: testCase.value },
      });

      expect(patch.status()).toBe(testCase.valid ? 200 : 422);
      if (!testCase.valid) {
        expect(await patch.json()).toHaveProperty('phone');
      }
    });
  }
});