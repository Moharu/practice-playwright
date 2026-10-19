# AI-assisted test case workflow

This document explains how the Playwright test cases were built with assistance from AI coding tools, and what had to be corrected along the way. The project's documentation and the running application were the source of truth, not the generated code.

## Goal

The objective was to turn the project's planned automation scope into a phase-based Playwright suite that was:

- aligned with the documented automation plan
- validated against the real app under test
- structured so that known defects remain visible without breaking the CI run
- easy to expand without mixing unrelated concerns

## Starting point

The work began from the project documentation in:

- [docs/test_cases.md](test_cases.md)
- [README.md](../README.md)

These files defined the test matrix, the automation priorities, and the expected behavior for registration, login, profile flows, API checks, and the shop.

## Phase-based approach

Rather than generating one large test file, the suite was divided into separate phases to keep each area focused and easier to validate.

### Phase 1: API smoke and validation

The first phase targeted fast, stable API checks and compared real responses from the live app (`http://localhost:8091`) with the OpenAPI schema:

- brands endpoint
- login success, wrong credentials, and an invalid token
- registration success and duplicate email rejection
- a one-digit phone on registration (a characterization test for issue #3)
- registration with only the fields the API requires
- the documented error message for a wrong current password

Request bodies follow the published schema: `dob` and a nested `address` object, not keys guessed from UI labels. The first draft got this wrong (see "What I reviewed and corrected" below). Response examples were treated as examples unless the schema defines a stronger constraint.

### Phase 2: UI smoke suite

The second phase covered the core UI journeys:

- login with valid credentials
- product catalog loading
- opening product detail pages

This phase validated the selectors and flow against the real Angular UI, ensuring the tests matched actual page structure and browser behavior.

### Phase 3: Defect regression coverage

Known failures were added as explicit regression checks, marked as expected failures with a `knownDefect()` helper (which wraps `test.fail()`), so they remain visible without breaking CI.

This pattern is useful when:

- a bug is known and tracked in GitHub issues
- the expected behavior is documented, but the product has not been fixed yet
- the team still wants the regression to remain visible in the test suite

It has one weakness: an expected-failure test also "passes" when it fails for the wrong reason. Running `CHECK_DEFECTS=1` executes these tests as normal tests, so the failure message shows whether each one fails on the assertion it was written for.

### Phase 4: Boundary/value-driven checks

This phase exercised edge cases such as:

- registration through the UI, as a positive control
- password rules, one missing requirement at a time
- the date-of-birth range
- phone-length boundaries

After the request body was corrected, the date-of-birth cases showed that the lower limit (18 years) is enforced with a 422 and a `dob` message, while the upper limit is looser than the documented 75 years: a 76-year-old can register (issue #9). The first version of these tests had reported a different mismatch, which turned out to come from wrong field names and a date that was one day short of 18, and that claim was removed.

## How AI assistance was used

AI assistance supported the project in several ways:

1. Interpreting the test plan and drafting executable Playwright tests (GitHub Copilot).
2. Suggesting a phase-based structure instead of one monolithic file.
3. Drafting shared helpers for disposable users and unique test data.
4. Helping design the CI setup so the separate app repo is started before Playwright runs.

The drafts were not trusted as written. Each one was run, and its assertions were compared with what the live application actually does.

## What I reviewed and corrected

I reviewed the generated tests against the running application, the OpenAPI schema, and page snapshots, and corrected these problems:

1. **Wrong field names produced a false defect.** The registration payload used `date_of_birth` and flat address fields instead of `dob` and a nested `address`. The API ignored them, so out-of-range dates appeared to be accepted. After fixing the payload, the date-of-birth tests found a different and real defect: the upper limit is looser than documented.
2. **Expected-failure tests hid wrong reasons.** `test.fail()` passes for any failure, so a test that failed on a wrong status code, a setup error, or a locator problem looked fine. I added `knownDefect()` and the `CHECK_DEFECTS=1` mode. Using it showed that two tests were failing for the wrong reasons, and I fixed them.
3. **Vacuous passes.** The weak-password tests passed because the registration form could not be submitted at all. It also requires a house number and a postal code valid for the selected country. I added a positive control (a valid registration that must succeed) and made the assertions check that no account is created.
4. **Shared data.** Tests failed logins and changed data on the seeded customer. Three failed logins lock an account, so they now use disposable users.
5. **A fixed password was rejected by the data-leak check.** Every user now gets a unique password.
6. **Hardcoded dates drifted.** An "18 years old" case was already 17 on the day it ran. The dates are now computed from today with a two-day margin.
7. **Assertions had been weakened to get a green run.** For example, "status is not 200" replaced "status is 401". I restored them to what I had verified manually.

## Important principle

The tests use the published API schema for request names and shapes, then validate the documented expectations against the running application. Where those disagree, the suite distinguishes the intended behavior from the observed behavior. It includes both:

- normal passing tests for verified behavior
- expected-failure tests for confirmed known defects or gaps between documentation and product behavior

Every expected-failure test points to its GitHub issue. This keeps the suite honest and gives a clear signal about what is fixed and what is still pending.

## CI guidance

The GitHub Actions workflow does not assume the app is already running. Instead, it:

- clones the app repo
- starts Docker services
- waits for the API to be ready
- then runs the Playwright suite

This is necessary because the target app is a separate repository from the test automation repo.

## Takeaway

Generated tests need the same scrutiny as generated code. A green run is not evidence that a test checks what it claims. What made this suite trustworthy was running every test against the live app, reading the real failure messages, and adding controls that prove each assertion can fail for the right reason.