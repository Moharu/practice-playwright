# AI-assisted test case workflow

This document explains how the Playwright test cases were built with assistance from an AI coding partner, using the project’s actual application behavior and documentation as the source of truth.

## Goal

The objective was to turn the project’s planned automation scope into a phase-based Playwright suite that was:

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

The first phase targeted the fast, stable API checks and verified the real responses against the live app:

- brands endpoint
- login success and failure
- registration success and duplicate email rejection
- phone update boundary validation

This phase used live requests against `http://localhost:8091` and served as the contract baseline for later UI coverage.

The API request bodies were checked against the published OpenAPI schema. For user registration, that means using `dob` and a nested `address` object rather than inferring request keys from UI labels. Response examples were treated as examples unless the schema defines a stronger constraint.

### Phase 2: UI smoke suite

The second phase covered the core UI journeys:

- login with valid credentials
- product catalog loading
- opening product detail pages

This phase validated the selectors and flow against the real Angular UI, ensuring the tests matched actual page structure and browser behavior.

### Phase 3: Defect regression coverage

Known failures were added as explicit regression checks using `test.fail()` so they would remain visible without breaking CI.

This pattern is useful when:

- a bug is known and tracked in GitHub issues
- the expected behavior is documented, but the product has not been fixed yet
- the team still wants the regression to remain visible in the test suite

### Phase 4: Boundary/value-driven checks

This phase exercised edge cases such as:

- password strength boundaries
- age/date-of-birth boundary values
- phone-length boundaries

The first run of this phase exposed mismatches between the OpenAPI age rule and the local app. The app accepts 17- and 76-year-old DOB values that the spec says should be rejected, and rejects a DOB on the exact 18th birthday that the tests expect to be valid. These cases remain visible as expected failures until the rule is clarified or the implementation is fixed.

## How AI assistance was used

The AI assistance supported the project in several ways:

1. Interpreting the test plan and translating it into executable Playwright tests.
2. Verifying API behavior directly against the running app before encoding assertions.
3. Identifying where a behavior mismatch existed between the documented spec and the live app.
4. Suggesting a phase-based structure instead of one monolithic file.
5. Helping design the CI setup so the separate app repo is started before Playwright runs.

## Important principle

The tests use the published API schema for request names and shapes, then validate the documented expectations against the running application. Where those disagree, the suite distinguishes the intended behavior from the observed behavior. It includes both:

- normal passing tests for verified behavior
- expected-failure tests for confirmed known defects or gaps between documentation and product behavior

This adds value because it keeps the suite honest and gives a clear signal about what is fixed versus what is still pending.

## CI guidance

The GitHub Actions workflow was adjusted so it does not assume the app is already running. Instead, it:

- clones the app repo
- starts Docker services
- waits for the API to be ready
- then runs the Playwright suite

This is necessary because the target app is a separate repository from the test automation repo.

## Takeaway

The workflow was practical and iterative:

- analyze the plan
- validate behavior against the app
- generate tests in phases
- keep defect coverage explicit
- verify the suite in context

This approach makes the suite easier to maintain, easier to reason about, and much more useful as a living QA asset.
