# Test cases

Test cases for registration, login, the profile page, 2FA, the API, and the main shop flows. Expected results come from the user stories (sprints 1 to 5, cited as S5 for sprint 5), the OpenAPI specification, and checks made against the running application in [exploratory session 01](exploratory/registration_and_login.md) and [session 02](exploratory/session_02_spec_review.md). Defects are tracked as [GitHub Issues](https://github.com/Moharu/practice-playwright/issues).

**Status:** first complete draft. Expected results that are still undecided are marked **TBC**.

## Conventions

- **IDs:** `REG` registration, `AUTH` login and password recovery, `PROF` profile and password change, `2FA` two-factor authentication, `API` direct API checks, `SHOP` shop flows.
- **Test names** in Playwright start with the ID, for example `test('REG-03: ...')`, so cases and code trace to each other.
- **Smoke** means the case belongs in the small suite that runs first on every push, tagged `@smoke`.
- **Known defects:** a case linked to an issue describes the *correct* behavior, so it fails until the bug is fixed. Mark it with `test.fail()` and the issue number in the annotation, so the suite stays green while the bug is open and flags it when the bug is fixed.
- **Characterization tests** (marked as such) assert the current behavior where no rule is defined, so any future change is noticed.
- **Priority:** High = critical path or security, Medium = important validation, Low = cosmetic or edge.

## Test data and safety rules

These come from behavior found in session 02 and protect the shared test data:

- **Seeded customer** (`customer@practicesoftwaretesting.com`, password `welcome01`): shared, so no test may change its password or lock it.
- **Account locking:** three consecutive failed logins lock an account. Wrong-password tests use a disposable account created for that test.
- **Forgot password** sets the password to a fixed value according to the OpenAPI description, so run it only against disposable accounts.
- **2FA:** setup is denied for the seeded accounts, so 2FA tests register their own accounts.
- **Unique emails:** register disposable accounts with a unique address per run, for example `qa+<timestamp>@example.com`. MailCatcher (`http://localhost:1080`) captures every email.
- **Tokens expire** (`expires_in: 120`, unit not stated). The login fixture should log in again or refresh (`GET /users/refresh`) in long runs.
- **Data is cleaned up automatically** about every hour (Privacy story, S5 AC1), so a hand-made account may disappear. Every run creates its own users.
- **Reset the application** with `docker compose exec laravel-api php artisan migrate:fresh --seed`.

---

## Registration

| ID | Title | Steps | Expected | Priority | Smoke | Type | Issue |
|---|---|---|---|---|---|---|---|
| REG-01 | Register with valid data | Fill every required field with valid values and submit | Account is created, a confirmation email arrives, and the user is redirected to the login page (S5 AC6). The new account can log in | High | Yes | UI | |
| REG-02 | Password of exactly 8 characters meeting all rules is accepted | Enter an 8-character password with upper case, lower case, a number and a special character | Accepted | Medium | No | UI | |
| REG-03 | Short password shows a message consistent with the 8-character rule | Enter `1234` | Rejected, and the message states the 8-character minimum shown in the UI hint, without mentioning invalid characters | High | No | UI | [#1](https://github.com/Moharu/practice-playwright/issues/1) |
| REG-04 | Password missing a required character class is rejected | Try passwords without an upper-case letter, a lower-case letter, a number, or a special character (one case each) | Rejected, and the requirement list shows which rule is not met (S5 AC2, AC3) | Medium | No | UI | |
| REG-05 | Strength bar follows the number of criteria met | Type passwords meeting 1, 2, 3, 4 and all criteria, without leaving the field | Weak, Moderate, Strong, Very Strong, Excellent (20% to 100%), updating while typing. `1234!@Test` shows Excellent (S5 AC4) | Low | No | UI | [#2](https://github.com/Moharu/practice-playwright/issues/2) |
| REG-06 | Phone number below the minimum is rejected | Register with phone `2` | Decision pending (see #3). Consistency with the update rule (7 to 24 characters) would mean it is rejected | Medium | No | UI | [#3](https://github.com/Moharu/practice-playwright/issues/3) |
| REG-07 | Phone number above the maximum is rejected | Register with 25 digits | Rejected (OpenAPI maximum is 24 characters) | Low | No | UI | |
| REG-08 | Each required field is enforced in the UI | Submit with one required field empty, repeating for every required field (first name, last name, date of birth, street, postal code, city, state, country, phone, email, password) | Submission blocked, with a message on the empty field (S5 AC1) | Medium | No | UI | |
| REG-09 | Invalid email format is rejected | Enter `abc`, `a@`, `@b.com`, and an address of 257 characters | Rejected (RFC-compliant format, maximum 256 characters) | Medium | No | UI | |
| REG-10 | Duplicate email is rejected | Register twice with the same email | The second attempt shows "Email is already in use." (S5 AC5) | Medium | No | UI | |
| REG-11 | Date of birth range | `POST /users/register` with `dob` values 17, 18, 75 and 76 years ago in YYYY-MM-DD format | OpenAPI expectation: 18 and 75 accepted; 17 and 76 rejected. Local API observation: 17 and 76 are accepted, while the exact 18th birthday is rejected. Keep these mismatches visible as expected-failure checks until clarified or fixed. | Medium | No | API | |
| REG-12 | Meaningful error when the API is unreachable | Block the `/register` request (abort the route in Playwright) and submit valid data | A readable error message, not the text "true" | Medium | No | UI | [#4](https://github.com/Moharu/practice-playwright/issues/4) |
| REG-13 | Name length limits | Enter a first name of 41 characters and a last name of 21 characters | Rejected (OpenAPI maximums: 40 and 20) | Low | No | UI | |

## Login and password recovery

| ID | Title | Steps | Expected | Priority | Smoke | Type | Issue |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Login with valid credentials | Log in as the seeded customer | Redirected to the account page, and the user's name is shown (S5 AC2) | High | Yes | UI | |
| AUTH-02 | Wrong password is rejected | Valid email of a disposable account, wrong password | "Invalid email or password" and no session (S5 AC3) | High | No | UI | |
| AUTH-03 | Unknown email gives the same message | Unregistered email, any password | The same generic message as AUTH-02 | High | No | UI | |
| AUTH-04 | Empty or invalid fields are flagged | Submit with an empty email, an invalid email, then an empty password | Validation message on the field (email required in a valid format, password required) | Medium | No | UI | |
| AUTH-05 | Logout ends the session | Log in, log out, then open the account page directly | Redirected to the login page | High | No | UI | |
| AUTH-06 | Account locks after three failed logins | Fail the login three times for a disposable account, then try again | "Account locked, too many failed attempts. Please contact the administrator." and HTTP 423 (S5 AC4) | High | No | UI | |
| AUTH-07 | Forgot password with a registered email | Request a reset for a disposable account | A confirmation message that fades after 3 seconds, and an email in MailCatcher. TBC: whether the new password is generated (story) or fixed (OpenAPI) | Medium | No | UI | |
| AUTH-08 | Forgot password with an unknown email | Request a reset for an unregistered email | An error message is shown (S5 AC4) | Low | No | UI | |
| AUTH-09 | Login redirects by role | Log in as the seeded customer, then as the admin | `/account` for users, `/admin/dashboard` for admins (S5 AC2) | Medium | No | UI | |

## Profile and password change

| ID | Title | Steps | Expected | Priority | Smoke | Type | Issue |
|---|---|---|---|---|---|---|---|
| PROF-01 | Update profile with valid data | Change the phone to a valid number and save | A success message that fades after 5 seconds, and the new value is shown after reload (S5 AC4) | Medium | No | UI | |
| PROF-02 | Phone number boundaries | Try 6, 7, 24 and 25 digits | 6 and 25 rejected, 7 and 24 accepted | Medium | No | UI | |
| PROF-03 | Email is read-only | Open the profile page | The email field cannot be edited (S5 AC3) | Low | No | UI | |
| PROF-04 | Change password with valid values | Enter the correct current password and a valid new password with matching confirmation | A success message, then logout after 5 seconds, and the new password works for login (S5 AC6) | High | No | UI | |
| PROF-05 | Wrong current password shows the documented message | Enter an incorrect current password | "Your current password does not matches with the password." (S5 AC4). The API returns it with a 400, and the UI shows it while the session is valid (retest in session 02). Passes today | Medium | No | UI | |
| PROF-06 | New password must differ from the current one | Use the current password as the new password | "New Password cannot be same as your current password." (S5 AC5) | Medium | No | UI | |
| PROF-07 | Confirmation must match | Enter a new password and a different confirmation | "Passwords do not match." (S5 AC3) | Medium | No | UI | |
| PROF-08 | Password found in a data leak is rejected | Use a leaked password such as `1234Test!` | Rejected with a warning that stays visible long enough to read. The feature is not in the stories, so the exact behavior is undocumented | Medium | No | UI | |
| PROF-09 | Previous error is cleared after a successful change | Trigger the data-leak warning, then submit a valid new password | Only the success message is shown | Low | No | UI | [#5](https://github.com/Moharu/practice-playwright/issues/5) |
| PROF-10 | Strength bar on the profile page updates while typing | Type a valid password in New Password | The bar updates with the same levels as registration (regression guard: this works today) | Low | No | UI | |
| PROF-11 | Required profile fields are enforced | Clear each required field (first name, last name, phone, street, postal code, city, state, country) and save | Blocked, with a message on the empty field (S5 AC2) | Medium | No | UI | |
| PROF-12 | Invalid session on change password | Log in, invalidate the session (log out in a second tab), then submit the change-password form | The user is sent to the login page or sees a clear session message, not a raw "Unauthorized" (the documentation is silent, so this is based on common practice) | Medium | No | UI | [#7](https://github.com/Moharu/practice-playwright/issues/7) |

## Two-factor authentication

| ID | Title | Steps | Expected | Priority | Smoke | Type | Issue |
|---|---|---|---|---|---|---|---|
| 2FA-01 | Enable 2FA (happy path) | Register an account, open the profile, scan or read the secret, enter a valid code | A QR code and the secret are shown, and "TOTP verified and enabled successfully." appears (S5 AC2 to AC4) | High | No | UI | |
| 2FA-02 | Profile shows no error after 2FA is enabled | Enable 2FA, then reload the profile page | The page shows that 2FA is enabled, with no error dialog | Medium | No | UI | [#6](https://github.com/Moharu/practice-playwright/issues/6) |
| 2FA-03 | Login with 2FA requires a valid code | Log in with a 2FA account, enter a wrong code, then a correct one | A 6-digit field appears, the wrong code shows "Invalid TOTP", the correct code authenticates (S5 AC7 to AC9) | High | No | UI | |
| 2FA-04 | Seeded accounts cannot set up 2FA | Try 2FA setup as the seeded customer | "Access denied: If you want to configure TOTP, please create your own account." (S5 AC6) | Low | No | UI | |
| 2FA-05 | Disable 2FA | Look for a way to turn 2FA off | TBC: no story or endpoint exists (open question Q-01) | Medium | No | UI | |

## API checks

For user registration, follow the OpenAPI request shape: `dob` and a nested `address` object. The schema requires `first_name`, `last_name`, `email`, and `password`. The local API also validates postal codes against the selected country, so fixtures should use a valid combination.

| ID | Title | Steps | Expected | Priority | Smoke | Type | Issue |
|---|---|---|---|---|---|---|---|
| API-01 | Brands endpoint returns data | `GET /brands` | 200 and a non-empty JSON list | High | Yes | API | |
| API-02 | Login returns a token | `POST /users/login` with the seeded customer | 200 with `access_token`, string `token_type`, and numeric `expires_in`. Swagger's `Bearer` value is an example, so casing is not asserted. | High | Yes | API | |
| API-03 | Wrong credentials are rejected | `POST /users/login` with a wrong password for a disposable account | Non-200 response (locally observed as 401; the OpenAPI spec lists only 200) | High | No | API | |
| API-04 | Registration accepts a one-digit phone (characterization) | `POST /users/register` with phone `0` | 201. Documents the current behavior behind #3 | Low | No | API | [#3](https://github.com/Moharu/practice-playwright/issues/3) |
| API-05 | Phone rule on update | `PATCH /users/{id}` with 6, 7, 24 and 25 digits, and `+55 (51) 1234-5678` | 422, 200, 200, 422, 200 (observed in session 02). Parameterize the values | Medium | No | API | [#3](https://github.com/Moharu/practice-playwright/issues/3) |
| API-06 | Phone error message names the broken rule | `PATCH /users/{id}` with 6 digits | A message about the minimum length, not about allowed characters | Low | No | API | [#8](https://github.com/Moharu/practice-playwright/issues/8) |
| API-07 | Duplicate email on registration | `POST /users/register` twice with the same email, using `dob` and nested `address` | 409 on the second request (OpenAPI) | Medium | No | API | |
| API-08 | Registration with only the required API fields | `POST /users/register` with first name, last name, email and password only | TBC: the schema requires only these four, but the UI requires more | Medium | No | API | |
| API-09 | TOTP setup when 2FA is already enabled | Send `POST /totp/setup` with the token of an account that already has 2FA enabled | 400 with an error message (OpenAPI). The API behaves as documented; the UI should not call it on load | Low | No | API | [#6](https://github.com/Moharu/practice-playwright/issues/6) |
| API-10 | Locked account response | Lock a disposable account, then `POST /users/login` | 423 (story S5 AC4; not in the OpenAPI spec). TBC: verify | Medium | No | API | |
| API-11 | Wrong current password on change-password | Send `POST /users/change-password` with a valid token and a wrong current password | 400 with `{"success":false,"message":"Your current password does not matches with the password."}` (observed in session 02; the OpenAPI spec lists only 200 and 401). Passes today | Medium | No | API | |
| API-12 | Invalid token is rejected | Send `POST /users/change-password` with an invalid or logged-out token | 401 `{"message":"Unauthorized"}` (OpenAPI) | Low | No | API | |

## Shop flows

Expected results come from the sprint 5 stories.

| ID | Title | Expected | Priority | Smoke | Type |
|---|---|---|---|---|---|
| SHOP-01 | Product catalog loads and opens details | The home page shows a grid of product cards with image, name and price, and clicking a card opens its detail page, which shows image, name, description, price, category badge, brand badge and related products | High | Yes | UI |
| SHOP-02 | Product search | 3 to 40 characters are accepted and show matching products. Fewer than 3 shows a validation error and runs no search. The input accepts at most 40. A search resets filters. Boundaries: 2, 3, 40, 41 | Medium | No | UI |
| SHOP-03 | Add to cart | The quantity starts at 1, plus and minus change it by 1, it cannot go below 1, and typed values are clamped to 1 and 999,999,999. Adding shows "Product added to shopping cart." An out-of-stock product has a disabled button | High | No | UI |
| SHOP-04 | Complete checkout | Cart review, then login for guests, then billing address (street 70, city 40, state 40, country 40, postal code 10, and an empty field disables Proceed), then payment with one of five methods. The order shows an invoice number and the cart is cleared | High | Yes | UI |
| SHOP-05 | Filter, sort and paginate | Category and brand filters combine, the four sort orders reorder the grid, and pagination highlights the current page | Medium | No | UI |

---

## Automation plan

1. **API first:** API-01 and API-02 (smoke), then API-03 to API-07. API-05 is a good parameterized test.
2. **UI smoke suite:** AUTH-01, REG-01, SHOP-01 and SHOP-04.
3. **Defect tests:** REG-03, REG-05, REG-06, REG-12, PROF-09, PROF-12, 2FA-02 and API-06, each marked as a known failure with its issue number.
4. **Data-driven tests next:** REG-04, REG-11, PROF-02 and SHOP-02, which are driven by boundary values.
5. **Fixtures:** an API helper that registers a disposable user and returns a token, and a stored login state for the seeded customer.

## Open items

- [ ] REG-06: decide the expected behavior once issue #3 is resolved.
- [ ] AUTH-07, 2FA-05, API-08, API-10: replace **TBC** with verified behavior.
- [ ] After running the issue script, check that D-07 and D-08 became #7 and #8, and fix the links if they didn't.