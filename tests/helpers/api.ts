import { expect, test, type APIRequestContext } from '@playwright/test';

export const API_BASE = process.env.API_BASE ?? 'http://localhost:8091';
export const UI_BASE = process.env.UI_BASE ?? 'http://localhost:4200';

// Shared seeded account. Tests must never change its password or fail logins on it
// (three failed logins in a row lock an account).
export const SEEDED_CUSTOMER = {
  email: 'customer@practicesoftwaretesting.com',
  password: 'welcome01',
};

export interface UserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  address: {
    street: string;
    house_number: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
}

let counter = 0;

/** A unique email address per call, so parallel tests and re-runs never collide. */
export function uniqueEmail(prefix: string): string {
  counter += 1;
  const slug = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  return `qa-${slug}-${Date.now()}-${counter}-${random}@example.com`;
}

/**
 * A password that meets every rule (8+ characters, upper and lower case, a number and a symbol)
 * and is unique per call. A fixed, common password is rejected by the app's data-leak check
 * with a 422, so never use a constant password for registration.
 */
export function uniquePassword(): string {
  counter += 1;
  return `A9!Tq${counter}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A date of birth that is `years` years and `extraDays` days before today (UTC).
 * A negative `extraDays` gives a date slightly closer to today.
 */
export function dobYearsAgo(years: number, extraDays = 0): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  date.setUTCDate(date.getUTCDate() - extraDays);
  return date.toISOString().slice(0, 10);
}

/**
 * A valid registration payload. The API expects `dob` and a nested `address`
 * object (see the OpenAPI schema); unknown fields are silently ignored.
 */
export function buildUser(overrides: Partial<UserPayload> = {}): UserPayload {
  return {
    first_name: 'QA',
    last_name: 'Tester',
    email: uniqueEmail('user'),
    password: uniquePassword(),
    phone: '1234567',
    dob: dobYearsAgo(30),
    address: {
      street: 'Main Street 1',
      house_number: '12',
      city: 'Testville',
      state: 'CA',
      country: 'US',
      postal_code: '12345',
    },
    ...overrides,
  };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Registers a disposable user, logs in, and returns the credentials, token and user id. */
export async function createUser(request: APIRequestContext, overrides: Partial<UserPayload> = {}) {
  const user = buildUser(overrides);

  const register = await request.post(`${API_BASE}/users/register`, { data: user });
  expect(
    register.status(),
    `registration of the disposable user should succeed. Response: ${await register.text()}`,
  ).toBe(201);

  const login = await request.post(`${API_BASE}/users/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(
    login.status(),
    `login of the disposable user should succeed. Response: ${await login.text()}`,
  ).toBe(200);
  const { access_token: token } = await login.json();

  const me = await request.get(`${API_BASE}/users/me`, { headers: authHeader(token) });
  expect(me.status(), 'GET /users/me should succeed').toBe(200);
  const { id } = await me.json();

  return { email: user.email, password: user.password, token: token as string, id: String(id) };
}

/**
 * Marks a test as an expected failure for a known, tracked defect.
 * Run with CHECK_DEFECTS=1 to execute it as a normal test and read the real failure
 * message: confirm the test fails for the reason you intend before trusting it.
 */
export function knownDefect(reason: string): void {
  if (!process.env.CHECK_DEFECTS) {
    test.fail(true, reason);
  }
}