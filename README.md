# Playwright practice repo

A QA automation portfolio project. It tests [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing) (a demo web shop with an Angular UI and a Laravel REST API), combining manual exploratory testing, documented defects, and a Playwright + TypeScript automation suite.

**Status:** work in progress. Exploratory testing and defect reporting are done for registration, login and the profile page. Automation is being built on top of those findings.

## What's in this repo

| Path | Contents |
|---|---|
| [`docs/exploratory/`](docs/exploratory/) | Exploratory testing session notes, with screenshots and GIFs as evidence |
| [`docs/ai_assisted_test_case_workflow.md`](docs/ai_assisted_test_case_workflow.md) | Notes on how the suite was built and validated with AI assistance |
| [`tests/`](tests/) | Playwright tests |
| [`.github/workflows/`](.github/workflows/) | GitHub Actions workflow |
| [`start-app.sh`](start-app.sh) | Starts the application under test in the right order and seeds the database |
| [`playwright.config.ts`](playwright.config.ts) | Playwright configuration |

## Findings so far

[Session 01: Registration, login and the profile page](docs/exploratory/registration_and_login.md) produced six defects, seven UX issues and four open questions. The defects are tracked as [GitHub Issues](https://github.com/Moharu/practice-playwright/issues):

| ID | Defect | Severity | Issue |
|---|---|---|---|
| D-01 | Conflicting password rules on sign-up | Medium | [#1](https://github.com/Moharu/practice-playwright/issues/1) |
| D-02 | Password strength bar only updates after the input regains focus | Low | [#2](https://github.com/Moharu/practice-playwright/issues/2) |
| D-03 | Phone number validation differs between sign-up and profile | Medium | [#3](https://github.com/Moharu/practice-playwright/issues/3) |
| D-04 | Error dialog shows "true" when the API is unreachable | Medium | [#4](https://github.com/Moharu/practice-playwright/issues/4) |
| D-05 | Stale "data leak" error remains next to the success message | Low | [#5](https://github.com/Moharu/practice-playwright/issues/5) |
| D-06 | "Failed to load TOTP setup details" on every profile visit after enabling 2FA | Medium | [#6](https://github.com/Moharu/practice-playwright/issues/6) |

The session was done without reading the project documentation, to simulate a first-time user. A second session will compare these findings against the documentation.

## Test strategy

Planned approach (this section will grow as the suite does):

- **Explore first, automate second.** Exploratory sessions decide what is worth automating.
- **API tests first.** They are fast and stable, and they show how the app's data behaves.
- **A small UI smoke suite** for the critical paths: login, search, cart and checkout.
- **Defects as tests.** Confirmed bugs get a test tagged with the issue number, so the test fails until the bug is fixed.
- **Independent, deterministic tests** that reset data with the database seed, with no fixed waits and with stable locators.

## Getting started

### Prerequisites

- Windows with WSL2 (Ubuntu), or any Linux environment
- Docker Engine with the Compose plugin
- Node.js and npm
- The application under test, cloned next to this repo:
  ```
  git clone https://github.com/testsmith-io/practice-software-testing.git ~/projects/practice-software-testing
  ```

### Start the application

```
./start-app.sh
```

The script starts the containers, applies the permission fix described under Troubleshooting, seeds the database, and waits until the API responds. Check the script for the path it expects for the application folder.

Once it is up:

- UI: `http://localhost:4200`
- API: `http://localhost:8091`
- API docs (Swagger): `http://localhost:8091/api/documentation`
- MailCatcher: `http://localhost:1080`

### Run the tests

```
npm ci
npx playwright install chromium
npx playwright test
```

Open the HTML report with `npx playwright show-report`.

## Roadmap

- [x] Set up the environment (WSL2, Docker Engine, the application under test)
- [x] Exploratory session 01: registration, login, profile
- [x] File defects as GitHub Issues
- [x] Exploratory session 02: check findings against the project documentation
- [ ] Test plan and test cases (`docs/`)
- [ ] API tests (login, brands, products)
- [ ] UI smoke tests (login, search, cart, checkout)
- [ ] Page objects and shared fixtures
- [ ] CI: run the suite on every push and publish the HTML report

## Troubleshooting

Notes on problems hit while setting up the application locally.

**The API returns 500 on a fresh setup.**
The cause was wrong container user permissions on the Laravel (API) container. Fix it with:

```
docker compose exec -u root laravel-api sh -c "chmod -R 777 storage bootstrap/cache"
docker compose exec laravel-api php artisan migrate:fresh --seed
```

These broad permissions are fine for a local practice app, but not for production.

**The API does not respond and the `web` container exited.**
nginx exited at startup because it could not resolve the hostname `phpmyadmin`. It is a startup-order problem: `web` started before `phpmyadmin` was available. Restarting `web` after the rest of the stack is up solves it (`docker compose up -d web`). `start-app.sh` does this automatically.

**Connection refused on port 8091 after restarting WSL.**
The containers stop when WSL stops. Run `./start-app.sh` again.

## About

Built by [João Vítor Bianchi Teló](https://www.linkedin.com/in/joaotelo) as a hands-on portfolio project for moving from software engineering into QA automation.