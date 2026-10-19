import { type Locator, type Page } from '@playwright/test';
import { UI_BASE, type UserPayload } from './api';

// Must match `address.country` ('US') in buildUser(): the postal code is validated per country.
const COUNTRY_LABEL = 'United States of America (the)';

async function fillIfEmpty(field: Locator, value: string): Promise<void> {
  if ((await field.inputValue()) === '' && (await field.isEditable())) {
    await field.fill(value);
  }
}

/**
 * Opens the registration page and fills every field so that the form is valid.
 *
 * What the page requires (seen in a page snapshot): a house number, and a postal code that is valid
 * for the selected country. Street, city and state are auto-filled from a postcode lookup, so they
 * are only filled here if they are still empty after that lookup settles.
 * The ids (#first_name, #dob, ...) were taken from the existing tests.
 */
export async function fillRegistrationForm(page: Page, user: UserPayload): Promise<void> {
  await page.goto(`${UI_BASE}/auth/register`);

  await page.locator('#first_name').fill(user.first_name);
  await page.locator('#last_name').fill(user.last_name);
  await page.locator('#dob').fill(user.dob);

  await page.locator('#country').selectOption({ label: COUNTRY_LABEL });
  await page.locator('#postal_code').fill(user.address.postal_code);
  await page.getByRole('textbox', { name: 'House number' }).fill(user.address.house_number);
  await page.waitForLoadState('networkidle'); // lets the postcode lookup finish

  await fillIfEmpty(page.locator('#street'), user.address.street);
  await fillIfEmpty(page.locator('#city'), user.address.city);
  await fillIfEmpty(page.locator('#state'), user.address.state);

  await page.locator('#phone').fill(user.phone);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
}

export async function submitRegistration(page: Page): Promise<void> {
  await page.getByRole('button', { name: /register|sign up/i }).click();
}