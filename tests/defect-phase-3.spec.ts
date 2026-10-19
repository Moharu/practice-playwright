import { test, expect } from '@playwright/test';
import { API_BASE, authHeader, buildUser, createUser, knownDefect, uniqueEmail } from './helpers/api';
import { fillRegistrationForm, submitRegistration } from './helpers/ui';

// Each test describes the CORRECT behavior and is marked as an expected failure while its issue
// is open. Run with CHECK_DEFECTS=1 to see the real failure and confirm it is the intended one.
test.describe('Defect regression phase 3', () => {
  test('REG-03: a short password is rejected with a message consistent with the 8-character rule (#1)', async ({ page }) => {
    knownDefect('Issue #1: conflicting password rules on sign-up');

    // Every other field is valid, so the password is the only thing that can be wrong.
    const user = buildUser({ email: uniqueEmail('reg-03'), password: '1234' });
    await fillRegistrationForm(page, user);
    await submitRegistration(page);

    // The message comes from the front end's own validation (no API call is made), so assert on the
    // alert next to the password field. The app marks it with data-test="password-error".
    const passwordAlert = page.locator('[data-test="password-error"]');
    await expect(passwordAlert, 'an error should be shown for a 4-character password').toBeVisible();
    await expect(passwordAlert, 'must not state the old 6-character rule').not.toContainText(/6 characters/i);
    await expect(passwordAlert, 'must not mention invalid characters for a numeric password').not.toContainText(/invalid characters/i);
    await expect(passwordAlert, 'should state the 8-character rule').toContainText(/\b8\b/);
  });

  test('API-06: the phone error message for a 6-digit value names the length rule (#8)', async ({ request }) => {
    knownDefect('Issue #8: phone validation message does not name the correct rule');

    // A disposable user: never modify the shared seeded customer.
    const { token, id } = await createUser(request);

    const patch = await request.patch(`${API_BASE}/users/${id}`, {
      headers: authHeader(token),
      data: { phone: '123456' },
    });

    // The value is rejected today, so this assertion passes and the one below is what fails.
    expect(patch.status()).toBe(422);
    expect(JSON.stringify(await patch.json())).toMatch(/at least|minimum|too short|\b7\b/i);
  });
});