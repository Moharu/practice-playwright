# Playwright Practice Repo

[![Playwright Tests](https://github.com/Moharu/practice-playwright/actions/workflows/playwright.yml/badge.svg)](https://github.com/Moharu/practice-playwright/actions/workflows/playwright.yml)

A QA automation portfolio project built against [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing), a demo Angular + Laravel e-commerce app.

The project follows one application through the whole QA workflow: exploratory testing, defect reports, documented test cases, and an automated Playwright (TypeScript) suite that proves real behavior with API checks, UI smoke flows, defect regressions, and boundary-value validation.

## What this project demonstrates

- **Exploratory testing and bug reporting:** two sessions (the first without documentation, the second against the user stories and the OpenAPI spec) produced nine defects, filed as GitHub Issues with steps, evidence, and severity
- **Test design with traceability:** from test cases, to automated tests, to issues
- **API-first automation** for the backend contract
- **UI smoke testing** for critical user journeys
- **Regression tests for known defects** while they remain open, checked so they fail for the intended reason
- **Boundary and data-driven validation** for input rules
- **Independent tests:** every test creates its own user, so nothing depends on shared data
- **A review of AI-generated tests:** what was wrong and how it was corrected ([notes](docs/ai_assisted_test_case_workflow.md))
- **CI:** a GitHub Actions workflow that starts the app under test, waits for it to be ready, and runs the Playwright suite

## Findings so far

Exploratory [session 01](docs/exploratory/registration_and_login.md) and the [documentation and API review](docs/exploratory/documentation_review.md) produced nine defects, tracked as [GitHub Issues](https://github.com/Moharu/practice-playwright/issues):

| ID | Defect | Severity | Issue |
|---|---|---|---|
| D-01 | Conflicting password rules on sign-up | Medium | [#1](https://github.com/Moharu/practice-playwright/issues/1) |
| D-02 | Password strength bar only updates after the input regains focus | Low | [#2](https://github.com/Moharu/practice-playwright/issues/2) |
| D-03 | Phone number validation differs between registration and profile update | Medium | [#3](https://github.com/Moharu/practice-playwright/issues/3) |
| D-04 | Error dialog shows "true" when the API is unreachable | Medium | [#4](https://github.com/Moharu/practice-playwright/issues/4) |
| D-05 | Stale "data leak" error remains next to the success message | Low | [#5](https://github.com/Moharu/practice-playwright/issues/5) |
| D-06 | "Failed to load TOTP setup details" on every profile visit after enabling 2FA | Medium | [#6](https://github.com/Moharu/practice-playwright/issues/6) |
| D-07 | Expired or invalid session shows a raw "Unauthorized" on change password | Low | [#7](https://github.com/Moharu/practice-playwright/issues/7) |
| D-08 | Phone validation message on update does not describe the rule that failed | Low | [#8](https://github.com/Moharu/practice-playwright/issues/8) |
| D-09 | Registration accepts dates of birth older than 75 years | Low | [#9](https://github.com/Moharu/practice-playwright/issues/9) |

## Test suite

26 Playwright tests (TypeScript) run in Chromium: 23 pass and 3 document open defects. The 3 are marked as expected failures, so the run stays green while the bugs are open, and flags it when one is fixed.

| Test | What it documents | Issue |
|---|---|---|
| REG-03 | A short password shows a message that states the old 6-character rule | [#1](https://github.com/Moharu/practice-playwright/issues/1) |
| API-06 | The phone validation message for a 6-digit value names the wrong rule | [#8](https://github.com/Moharu/practice-playwright/issues/8) |
| REG-11 (just over 75) | The API accepts dates of birth older than 75 years | [#9](https://github.com/Moharu/practice-playwright/issues/9) |

See [`docs/test_cases.md`](docs/test_cases.md) for what each case covers and which ones are automated (17 of 56 so far).

## Key project files

| Path | Purpose |
|---|---|
| [`docs/test_cases.md`](docs/test_cases.md) | Core test plan and expected outcomes |
| [`docs/ai_assisted_test_case_workflow.md`](docs/ai_assisted_test_case_workflow.md) | How this suite was built with AI assistance, and what had to be corrected |
| [`docs/exploratory/`](docs/exploratory/) | Exploratory session notes, the documentation review, and screenshots |
| [`tests/api-phase-1.spec.ts`](tests/api-phase-1.spec.ts) | API smoke and validation suite |
| [`tests/ui-phase-2.spec.ts`](tests/ui-phase-2.spec.ts) | UI smoke suite |
| [`tests/defect-phase-3.spec.ts`](tests/defect-phase-3.spec.ts) | Known defect regressions |
| [`tests/boundary-phase-4.spec.ts`](tests/boundary-phase-4.spec.ts) | Registration through the UI, boundary and data-driven checks |
| [`tests/helpers/`](tests/helpers/) | Shared helpers: disposable users, unique emails and passwords, the registration form |
| [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) | GitHub Actions CI workflow |
| [`start-app.sh`](start-app.sh) | Starts the app and seeds the database |

## Getting started

### Prerequisites

- Linux/macOS/WSL2
- Docker + Compose
- Node.js and npm

### Run the app

```bash
git clone https://github.com/testsmith-io/practice-software-testing.git ~/projects/practice-software-testing
cd ~/projects/practice-playwright
./start-app.sh
```

The UI is at `http://localhost:4200` and the API at `http://localhost:8091`. Set `UI_BASE` or `API_BASE` to point the tests somewhere else.

### Run the tests

```bash
npm ci
npx playwright install --with-deps chromium
npx playwright test --project=chromium --reporter=list
```

To see why the known-defect tests fail, run them as normal tests:

```bash
CHECK_DEFECTS=1 npx playwright test defect-phase-3 --project=chromium --reporter=list
```

Tests create their own users with unique emails and passwords, so they never touch the shared seeded account. The reset command for the app is `docker compose exec laravel-api php artisan migrate:fresh --seed`, run from the app folder.

## Roadmap

- [x] Set up the environment (WSL2, Docker Engine, the application under test)
- [x] Exploratory session 01: registration, login, profile
- [x] File defects as GitHub Issues
- [x] Exploratory session 02: check findings against the documentation and the API
- [x] Test plan and test cases ([`docs/test_cases.md`](docs/test_cases.md))
- [x] API tests (login, registration, change-password errors, phone and date-of-birth boundaries)
- [x] UI tests: login, catalog, and registration
- [x] Shared helpers for disposable users and unique data
- [ ] UI tests for the cart and checkout
- [ ] The remaining defect tests (REG-05, REG-12, PROF-09, PROF-12, 2FA-02)
- [x] CI: a GitHub Actions workflow that starts the app and runs the suite

## About me

Built by [João Vítor Bianchi Teló](https://www.linkedin.com/in/joaotelo) as a practical QA automation portfolio project.