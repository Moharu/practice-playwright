import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8091';
const SEEDED_CUSTOMER = {
  email: 'customer@practicesoftwaretesting.com',
  password: 'welcome01',
};

function decodeJwtSub(token: string): string {
  const payload = token.split('.')[1];
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString()).sub;
}

test.describe('API phase 1', () => {
  test('API-01: brands endpoint returns data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/brands`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
  });

  test('API-02: login returns a token', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/login`, {
      data: SEEDED_CUSTOMER,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('token_type', 'bearer');
    expect(body).toHaveProperty('expires_in');
    expect(Number(body.expires_in)).toBeGreaterThan(0);
  });

  test('API-03: wrong credentials are rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/login`, {
      data: {
        email: SEEDED_CUSTOMER.email,
        password: 'wrongpass',
      },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  test('API-07: register unique user and reject duplicate email', async ({ request }) => {
    const email = `qa-${Date.now()}@example.com`;
    const password = `A9!StrongPass${Date.now()}`;
    const payload = {
      first_name: 'QA',
      last_name: 'Valid',
      email,
      password,
      phone: '1234567',
      street: 'Main',
      postal_code: '12345',
      city: 'Testville',
      state: 'SP',
      country: 'BR',
      date_of_birth: '2000-01-01',
    };

    const firstResponse = await request.post(`${API_BASE}/users/register`, {
      data: payload,
    });
    expect(firstResponse.status()).toBe(201);

    const createdUser = await firstResponse.json();
    expect(createdUser).toHaveProperty('email', email);
    expect(createdUser).toHaveProperty('first_name', 'QA');

    const secondResponse = await request.post(`${API_BASE}/users/register`, {
      data: payload,
    });

    expect(secondResponse.status()).toBe(409);
    const duplicateBody = await secondResponse.json();
    expect(duplicateBody).toHaveProperty('email');
  });

  test('API-05: patch phone accepts valid values and rejects overlong values', async ({ request }) => {
    const email = `qa-phone-${Date.now()}@example.com`;
    const password = `A9!StrongPass${Date.now()}`;
    const registerResponse = await request.post(`${API_BASE}/users/register`, {
      data: {
        first_name: 'QA',
        last_name: 'Phone',
        email,
        password,
        phone: '1234567',
        street: 'Main',
        postal_code: '12345',
        city: 'Testville',
        state: 'SP',
        country: 'BR',
        date_of_birth: '2000-01-01',
      },
    });

    expect(registerResponse.status()).toBe(201);

    const loginResponse = await request.post(`${API_BASE}/users/login`, {
      data: { email, password },
    });

    expect(loginResponse.status()).toBe(200);
    const loginBody = await loginResponse.json();
    const userId = decodeJwtSub(loginBody.access_token);

    const validPatch = await request.patch(`${API_BASE}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${loginBody.access_token}`,
      },
      data: {
        phone: '1234567',
      },
    });

    expect(validPatch.status()).toBe(200);
    expect(await validPatch.json()).toHaveProperty('success', true);

    const invalidPatch = await request.patch(`${API_BASE}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${loginBody.access_token}`,
      },
      data: {
        phone: '1234567890123456789012345',
      },
    });

    expect(invalidPatch.status()).toBe(422);
    const invalidBody = await invalidPatch.json();
    expect(invalidBody).toHaveProperty('phone');
  });
});
