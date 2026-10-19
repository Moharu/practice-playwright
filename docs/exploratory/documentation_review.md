# Session 02: Documentation review

## Session info

- **Date:** 2026-10-17 to 2026-10-18 (documentation and API review, then checks prompted by the automated tests)
- **Charter:** Compare the findings from [session 01](registration_and_login.md) against the project documentation, and classify each one.
- **Sources read:** the user stories for sprints 1 to 5 in the [Practice Software Testing documentation](https://testsmith-io.github.io/practice-software-testing/#/). The app under test is at sprint 5, so sprint 5 is the reference. Earlier sprints are cited only where they explain a difference.
  - The OpenAPI specification behind `http://localhost:8091/api/documentation` (Toolshop API 5.0.0), read in full on 2026-10-17. It describes request fields, limits and documented status codes, but not UI messages.
- **Also used:** page snapshots and API responses captured while automating the tests (see New findings).
- **Application:** Practice Software Testing (sprint: 5, commit: `ae7caecb`)
- **Citation format:** story name, sprint and acceptance criterion, for example "Registration, S5 AC2". The documentation is paraphrased, not copied.

## How findings are classified

| Result | Meaning | What happens to the issue |
|---|---|---|
| **Confirmed** | The docs describe behavior the app doesn't follow, or the docs are silent and the behavior is clearly broken | Stays open. Add a comment citing the relevant story |
| **Documented** | The app does what the docs say | Close as "not planned" with a comment citing the story. It may remain a UX suggestion |
| **Spec gap** | The docs are silent or ambiguous and it is unclear which behavior is correct | Stays open, labeled `spec-gap`, as a question for the product owner |
| **Contradiction** | The docs disagree with themselves or with the app | Stays open. Describe both sides in a comment |

---

## Defects

| ID | Issue | Finding | Docs say | Result | Action |
|---|---|---|---|---|---|
| D-01 | [#1](https://github.com/Moharu/practice-playwright/issues/1) | Conflicting password rules on sign-up (8 vs. 6) | Registration S5 AC2 and AC3: at least 8 characters, upper and lower case, a number and a special character, with the requirement list updating as you type. The older 6 to 40 character rule is from sprint 4 (Registration S4 AC4). Nothing documents an "invalid characters" check. The OpenAPI schema for registration agrees with sprint 5: password minimum length 8, and it must include upper case, lower case, a number and a symbol. | **Confirmed** | Keep open. The "6 characters" message matches the superseded sprint 4 rule, and the "invalid characters" message is undocumented |
| D-02 | [#2](https://github.com/Moharu/practice-playwright/issues/2) | Strength bar only updates after refocus | Registration S5 AC3 and AC4: requirements update immediately while typing, and the strength level reflects how many of the four criteria are met (Weak 1, Moderate 2, Strong 3, Very Strong 4, Excellent all four, bar 20% to 100%). `1234!@Test` meets all four, so it should show Excellent. | **Confirmed** | Keep open. Add the documented mapping to the issue |
| D-03 | [#3](https://github.com/Moharu/practice-playwright/issues/3) | Phone validation differs between sign-up and profile | Registration S5 AC1: phone is required and numeric only. Profile S5 AC2: phone is required. Neither story gives length limits. The OpenAPI schema for registration sets a maximum of 24 characters for phone and no minimum, which matches the profile's maximum of 24. The profile's minimum of 7 is not documented anywhere. | **Confirmed** (the API itself is inconsistent) | Keep open. Registration accepts phone `0` (201 on the local and deployed APIs), while `PATCH /users/{id}` with the same value returns 422, so the two endpoints disagree. Which limit is correct is still undocumented, so also add the `spec-gap` label |
| D-04 | [#4](https://github.com/Moharu/practice-playwright/issues/4) | Dialog shows "true" when the API is unreachable | No story covers error handling when the API is unavailable. | **Confirmed** (docs silent, behavior clearly broken: a bare "true" is not a message) | Keep open |
| D-05 | [#5](https://github.com/Moharu/practice-playwright/issues/5) | Stale data-leak error next to the success message | The data-leak password check is not in any sprint 5 story. Change Password S5 AC6: a success message is shown, then the user is logged out after 5 seconds. Nothing says earlier errors are cleared. | **Confirmed** (docs silent, and a stale error beside a success message is wrong under any reading) | Keep open. Note that the data-leak feature itself is undocumented |
| D-06 | [#6](https://github.com/Moharu/practice-playwright/issues/6) | "Failed to load TOTP setup details" after enabling 2FA | 2FA Setup S5 AC1 to AC4: a setup section on the profile, a QR code, the secret as text, and the message "TOTP verified and enabled successfully." No story says what the profile shows once 2FA is enabled. The OpenAPI spec documents `POST /totp/setup` returning 400 when TOTP is already enabled, so the API behaves as documented and the fault is in the front end calling it on every visit. | **Confirmed** (docs silent on the enabled state, and an error on every visit is clearly broken) | Keep open. The API behaves as documented, so the issue is the front end calling setup on load. See also Q-01 |

## UX issues

| ID | Finding | Docs say | Result | Action |
|---|---|---|---|---|
| U-01 | "Unauthorized" for a wrong current password | Change Password S5 AC4 (also S4 AC2): a wrong current password shows a specific message, "Your current password does not matches with the password." The app shows "Unauthorized". The OpenAPI spec lists only 200 and 401 for the change-password endpoint. A direct request with a wrong current password returns 400 with the documented message, and on a later retest the UI showed that same message while the session was valid. The "Unauthorized" dialog appears when the session is invalid: it was reproduced by logging out in a second tab and then submitting the form. The session 01 occurrence was most likely an expired session. | **Confirmed**, reframed as defect **D-07** (invalid session, not a wrong password) | Retitle and rewrite issue #7 |
| U-02 | Data-leak warning disappears too quickly | Not documented. Only the profile update message (5 seconds) and the forgot-password confirmation (3 seconds) have stated durations. | **Spec gap** | Keep as a UX suggestion |
| U-03 | Silent redirect after a password change | Change Password S5 AC6: success message, then logout after 5 seconds. | **Documented** | Keep only as a suggestion: tell the user why they are being logged out |
| U-04 | Required-field markers are inconsistent | Not documented. | **Spec gap** | Keep as a UX suggestion |
| U-05 | Date of birth has no input mask | Registration S5 AC1: date of birth in ISO format, YYYY-MM-DD. No mention of a mask or picker. | **Documented** (the format) | Keep only as a suggestion |
| U-06 | Phone field gives no format or country guidance | Registration S5 AC1: phone is numeric only, so rejecting "+" matches the story. A country dropdown exists, and no story states which countries are supported (see Q-02). However, the API's own validation message on update says phone may contain digits, spaces and the characters ( ) + - ., which contradicts the story. A `PATCH` request with `+55 (51) 1234-5678` returned 200, so the API does accept them. | **Contradiction** (story vs. API) | Keep the guidance suggestion, and raise the mismatch: the UI follows the story, while the API accepts more |
| U-07 | Current Password has no show/hide toggle | Not documented. | **Spec gap** | Keep as a UX suggestion |

## Open questions

| ID | Question | Answer from the docs | Result |
|---|---|---|---|
| Q-01 | Can users disable 2FA? | No story covers it. Only setup and verification are described (2FA Setup S5). | **Spec gap** |
| Q-02 | Is the product limited to one country? | Registration S5 AC1 has a country dropdown and nothing about supported countries. Sprint 4 required a postcode of exactly 5 digits, while sprint 5 says only "numeric". | **Spec gap** |
| Q-03 | Is the 2-character login password check intended? | Login S4 AC2 and AC3: email required in a valid format, password required. Nothing about password length on login, and the sprint 5 login story doesn't repeat these rules. | **Spec gap** (low priority) |
| Q-04 | Is the forced logout after a password change intended? | Yes. Change Password S5 AC6. | **Documented** |

---

## Answers to the TBC items in the test cases

| Test case | Question | Answer |
|---|---|---|
| REG-07 | Same phone limits on registration as the profile page? | Partly. The OpenAPI schema sets a maximum of 24 characters and no minimum for registration. A minimum is not documented anywhere, so the lower limit is not defined. Direct requests with phone `0` to the local API (`localhost:8091`) and to the deployed API both returned 201, so the API accepts a one-digit phone. Updating the profile with `0` through `PATCH /users/{id}` returns 422, so the two endpoints disagree. |
| REG-10 | What happens on a duplicate email? | The message "Email is already in use." (Registration S5 AC5). **Resolved.** |
| REG-11 | Date of birth rules? | **Resolved.** The format is YYYY-MM-DD (Registration S5 AC1), and the OpenAPI schema says the date must be between 18 and 75 years ago. Checked against the API: the lower limit is enforced (422 with `{"dob":["Customer must be 18 years old."]}`), but the upper limit is looser than documented. Dates up to at least 76 years and 2 days are accepted, while 1930-01-01 is rejected with "Customer must be younger than 75 years old." (see D-09). The status is 422, while the OpenAPI spec lists only 400 for registration. |
| PROF-03 | Is the redirect after a password change documented? | Yes: success message, then logout after 5 seconds (Change Password S5 AC6). **Resolved.** |
| 2FA-04 | Can 2FA be disabled? | No story covers it. Still TBC. |
| API-03, API-04 | Status codes and bodies for invalid input? | Partly. Registration lists 201, 400, 401, 403 and 409 (duplicate email). Requests with phone `0` to the local and deployed APIs both returned 201, so the API does not enforce a phone minimum on registration (API-04 answered). `PATCH /users/{id}` with phone `0` returns 422 with a message about allowed characters, so the update endpoint validates phone and registration does not. Login lists only 200 in the spec, but a real wrong-password request returned 401 Unauthorized (response body not recorded). The stories add 423 for a locked account, which has not been tested. |

## New findings from the docs

Behavior the stories describe that session 01 did not cover:

- **Account locking:** three consecutive failed logins lock the account ("Account locked, too many failed attempts. Please contact the administrator.", HTTP 423). Admin accounts are exempt (Login S5 AC4 and AC5). **Test impact:** wrong-password tests must use disposable accounts, or the seeded customer may get locked.
- **Disabled accounts** cannot log in and see "Account disabled." (Login S5 AC6).
- **Seeded test accounts cannot set up TOTP.** Setup is denied for `customer@practicesoftwaretesting.com` and the admin account (2FA Setup S5 AC6). **Test impact:** 2FA tests need their own registered accounts.
- **Invalid TOTP at login** shows "Invalid TOTP" (Login S5 AC9).
- **Change password rules not yet tested:** the new password must differ from the current one ("New Password cannot be same as your current password.") and the confirmation must match ("Passwords do not match.") (Change Password S5 AC3 and AC5).
- **Emails:** registration sends a confirmation email, and forgot password generates a new password and emails it (Registration S5 AC6, Forgot Password S5 AC3). MailCatcher at `http://localhost:1080` can be used to verify them.
- **Account enumeration is by design:** registration reveals existing emails ("Email is already in use.") and forgot password shows an error for unknown emails, while login stays generic.
- **Login redirects by role:** `/account` for users and `/admin/dashboard` for admins (Login S5 AC2).
- **Documentation quirk:** the documented current-password message contains a grammar error ("does not matches"). Worth raising with the maintainers.
- **Seeded credentials confirmed:** the OpenAPI login example uses `customer@practicesoftwaretesting.com` with the password `welcome01`.
- **Forgot password contradicts itself:** the story says a new password is generated and emailed (Forgot Password S5 AC3), while the OpenAPI description says the endpoint sets the password to a fixed value, `welcome02`. **Test impact:** running forgot password against the seeded customer changes its password, so reseed afterward (`migrate:fresh --seed`) or use a disposable account.
- **The API requires fewer fields than the UI:** the registration schema requires only first name, last name, email and password, while the stories mark date of birth, address, phone and more as required. Some required-field validation exists only in the front end. Verified (API-08): a registration with a date of birth and no phone or address returns 201 with the address fields null.
- **Date of birth rule:** the date must be between 18 and 75 years ago (OpenAPI schema). Boundary tests: 17, 18, 75 and 76 years.
- **Field limits (OpenAPI):** first name 40, last name 20, email 256, phone 24, street 70, house number 10, city 40, state 40, country 40, postal code 10 characters.
- **Tokens expire:** the login response includes `expires_in: 120` (unit not stated) and there is a `GET /users/refresh` endpoint. **Test impact:** a Playwright login fixture must refresh or re-login for long runs.
- **Account state is visible through the API:** the user response includes `enabled`, `totp_enabled` and `failed_login_attempts`, which an admin token can use to verify locking and 2FA state in tests.
- **The registration form differs from the sprint 5 story.** A page snapshot shows a required house number, a postal code that is validated for the selected country ("Please enter a valid postal code for the selected country."), and a note that street, city and state are filled in automatically (the `/postcode-lookup` endpoint in the OpenAPI spec). The story lists none of this and calls the postal code "numeric". **Test impact:** the UI needs a country and a postal code that match.
- **Common passwords are rejected by a data-leak check.** The API returns `422` with `{"password":["The given password has appeared in a data leak. Please choose a different password."]}` for a common password such as `Str0ng!Passw0rd`. The feature is not in the stories. **Test impact:** every registered user needs a unique password. This message is also the API-level expected result for PROF-08.
- **The password messages in D-01 come from the front end.** No API call is made: the alert (`data-test="password-error"`) already shows "Password must be minimal 6 characters long." and "Password can not include invalid characters." from client-side validation.
- **Date of birth is enforced only on the lower side as documented (D-09).** 17 years 363 days is rejected and 18 years 2 days accepted. Over the upper limit, 75 years 2 days, 180 days, 364 days and 76 years 2 days are all accepted, while 1930-01-01 is rejected. Found while automating REG-11, after a wrong field name had produced a false "known mismatch".
- **Phone validation on update (verified with `PATCH /users/{id}`):** 6 digits are rejected (422), 7 and 24 digits are accepted (200), 25 digits are rejected (422), and `+55 (51) 1234-5678` is accepted (200). So the API enforces 7 to 24 characters, matching the profile page, but only on update and not on registration (D-03). Two further problems:
  1. The rejection for 6 digits says the phone "may only contain digits, spaces and the characters ( ) + - .", although the value is only digits, so the message hides the real rule. The 25-digit case shows that message plus an accurate length message. This is a new defect, **D-08**.
  2. The API accepts `+`, spaces, parentheses, hyphen and period, while the story says numeric only and the UI rejects `+` (U-06).
  3. A value with no digits at all (`-------`) is also accepted (200), so the rule checks length and allowed characters, not that a phone number contains digits.
- **Change-password errors are missing from the OpenAPI spec:** a wrong current password returns `400` with `{"success":false,"message":"Your current password does not matches with the password."}`, while the spec lists only 200 and 401. The API returns the documented message, and the UI displays it while the session is valid. The raw "Unauthorized" appears only with an invalid session (D-07).

## Summary

| Result | Count | Items |
|---|---|---|
| Confirmed | 7 | D-01, D-02, D-03, D-04, D-05, D-06, U-01 (reframed as D-07) |
| Documented | 3 | U-03, U-05, Q-04 |
| Spec gap | 6 | U-02, U-04, U-07, Q-01, Q-02, Q-03 |
| Contradiction | 1 | U-06 (story vs. API) |

D-01 is the main case where the documentation history matters: the app's validation message follows the sprint 4 rule, and the UI hint follows sprint 5. The OpenAPI schema also requires a minimum of 8, so the "6 characters" message contradicts both the UI hint and the API contract.

Not counted in the table: one documentation contradiction found in the OpenAPI spec (forgot password) and two new defects, D-08 (misleading phone validation message) and D-09 (upper date-of-birth limit not enforced as documented), all described in New findings.

## Follow-up

- [x] Comments posted on issues #1 to #6, the `spec-gap` label created and applied to #3, and D-07 and D-08 filed.
- [x] The resolved **TBC** entries are replaced in `docs/test_cases.md`.
- [x] The OpenAPI spec, the API and the automated tests were used to settle the open API questions.
- [ ] Confirm that issue #7 describes the session-expiry cause (`rewrite-d07.sh`), and attach a screenshot.
- [ ] File D-09 (upper date-of-birth limit) and add the exact cutoff once it is found.
- [ ] Optional: check whether other authenticated actions (profile update, favorites, invoices) show the same raw "Unauthorized" with an invalid session.
- [ ] Tick the session 02 item in the README roadmap.