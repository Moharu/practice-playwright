import { test, expect } from '@playwright/test';
import { API_BASE, SEEDED_CUSTOMER, authHeader, buildUser, createUser } from './helpers/api';

test.describe('API phase 1', () => {
  test('API-01: brands endpoint returns data @smoke', async ({ request }) => {
    const response = await request.get(`${API_BASE}/brands`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
    expect(body[0]).toHaveProperty('slug');
  });

  test('API-02: login returns a token @smoke', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/login`, { data: SEEDED_CUSTOMER });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.token_type).toBe('string');
    expect(typeof body.expires_in).toBe('number');
    expect(body.expires_in).toBeGreaterThan(0);
  });

  test('API-03: wrong credentials are rejected', async ({ request }) => {
    // A disposable user: failed logins must never hit the shared seeded account.
    const { email } = await createUser(request);

    const response = await request.post(`${API_BASE}/users/login`, {
      data: { email, password: 'WrongPass1!' },
    });

    expect(response.status()).toBe(401);
  });

  test('API-04: registration accepts a one-digit phone (characterization, issue #3)', async ({ request }) => {
    // Documents current behavior: registration has no minimum phone length,
    // while updating the phone does (see PROF-02 / API-05). Update this test if #3 is resolved.
    const response = await request.post(`${API_BASE}/users/register`, {
      data: buildUser({ phone: '0' }),
    });

    expect(response.status()).toBe(201);
  });

  test('API-07: register a unique user and reject a duplicate email', async ({ request }) => {
    const user = buildUser();

    const first = await request.post(`${API_BASE}/users/register`, { data: user });
    expect(first.status()).toBe(201);

    // The response echoes the fields we sent, which proves the field names are right.
    const created = await first.json();
    expect(created).toMatchObject({
      email: user.email,
      first_name: user.first_name,
      dob: user.dob,
    });
    expect(created.address).toMatchObject({ city: user.address.city });

    const second = await request.post(`${API_BASE}/users/register`, { data: user });
    expect(second.status()).toBe(409);
  });

  test('API-08: registration works without phone and address (characterization)', async ({ request }) => {
    // The API requires only first name, last name, email and password (OpenAPI), while the UI also
    // requires a house number, a valid postal code and a phone. Verified in session 02 with a date
    // of birth and no phone or address.
    const { first_name, last_name, email, password, dob } = buildUser();

    const response = await request.post(`${API_BASE}/users/register`, {
      data: { first_name, last_name, email, password, dob },
    });

    expect(response.status()).toBe(201);
    expect((await response.json()).address).toMatchObject({ street: null, city: null, country: null });
  });

  test('API-11: wrong current password on change-password returns the documented message', async ({ request }) => {
    const { token } = await createUser(request);

    const response = await request.post(`${API_BASE}/users/change-password`, {
      headers: authHeader(token),
      data: {
        current_password: 'WrongPass1!',
        new_password: 'Another1!Passw0rd',
        new_password_confirmation: 'Another1!Passw0rd',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ success: false });
    expect(body.message).toMatch(/Your current password does not match/);
  });

  test('API-12: an invalid token is rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/users/change-password`, {
      headers: authHeader('not-a-valid-token'),
      data: {
        current_password: 'WrongPass1!',
        new_password: 'Another1!Passw0rd',
        new_password_confirmation: 'Another1!Passw0rd',
      },
    });

    expect(response.status()).toBe(401);
  });
});