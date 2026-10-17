# Playwright Practice Repo

A QA automation portfolio project built against [Practice Software Testing](https://github.com/testsmith-io/practice-software-testing), a demo Angular + Laravel e-commerce app.

This repo focuses on proving real behavior with Playwright and TypeScript: API checks, UI smoke flows, defect regressions, and boundary-value validation.

## What this project demonstrates

- API-first automation for the backend contract
- UI smoke testing for critical user journeys
- Regression tests for known defects while they remain open
- Boundary and data-driven validation for input rules
- CI setup that starts the app under test before running Playwright

## Key project files

| Path | Purpose |
|---|---|
| [`docs/test_cases.md`](docs/test_cases.md) | Core test plan and expected outcomes |
| [`docs/ai_assisted_test_case_workflow.md`](docs/ai_assisted_test_case_workflow.md) | Notes on how this suite was built with AI assistance |
| [`docs/exploratory/`](docs/exploratory/) | Exploratory notes and screenshots |
| [`tests/api-phase-1.spec.ts`](tests/api-phase-1.spec.ts) | API smoke and validation suite |
| [`tests/ui-phase-2.spec.ts`](tests/ui-phase-2.spec.ts) | UI smoke suite |
| [`tests/defect-phase-3.spec.ts`](tests/defect-phase-3.spec.ts) | Known defect regressions |
| [`tests/boundary-phase-4.spec.ts`](tests/boundary-phase-4.spec.ts) | Boundary and data-driven checks |
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

### Run the tests

```bash
npm ci
npx playwright install --with-deps
npx playwright test
```

## Why this project is relevant

It shows practical QA automation work across the full lifecycle:

- requirement interpretation
- exploratory testing
- defect reporting
- regression automation
- CI-ready execution against a real app

This is the kind of work a recruiter or hiring manager can quickly understand: it is not just a toy example, it is a realistic automation workflow for a real application.

## About me

Built by [João Vítor Bianchi Teló](https://www.linkedin.com/in/joaotelo) as a practical QA automation portfolio project.