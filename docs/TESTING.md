# Automated Testing — GymApp

GymApp uses a **testing pyramid**: fast unit tests, API integration tests against an isolated MySQL database, and optional Playwright E2E tests.

## Quick start

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
. G:\vibe-coding\devkit\scripts\activate-dev.ps1
. G:\vibe-coding\devkit\scripts\start-mysql.ps1

cd G:\vibe-coding\projects\gymapp
copy .env.test.example .env.test

# One-time: create test DB + full test run with log
pnpm test:setup
pnpm test:run
```

## Test database

| Item | Value |
|------|-------|
| Database | `gymapp_test` (never uses `gymapp`) |
| URL | `mysql://gymapp:gymapp_dev@localhost:3306/gymapp_test` |
| Config | `.env.test` (copy from `.env.test.example`) |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm test:setup` | Create `gymapp_test` + push schema + seed |
| `pnpm test:run` | Full unit + API run with log in `test-results/` |
| `pnpm test` | Unit + API tests |
| `pnpm test:unit` | Jest unit tests only (no DB) |
| `pnpm test:api` | Jest API integration tests (needs test DB) |
| `pnpm test:e2e` | Playwright browser tests (starts `pnpm dev` if not running) |
| `pnpm test:all` | Unit + API + E2E |
| `pnpm test:cov` | Backend coverage report |

## Structure

```
backend/
├── src/**/*.spec.ts          Unit tests (workflow, payment math, BMI)
├── test/
│   ├── setup.ts              Loads .env.test
│   ├── helpers/              App bootstrap, auth, DB reset
│   └── api/*.e2e-spec.ts     HTTP integration tests
frontend/
├── src/**/*.test.ts          Vitest component/util tests
└── e2e/*.spec.ts             Playwright golden paths
test-results/                   Logs and Playwright reports (gitignored)
```

## What's covered

### Unit
- Enquiry status workflow transitions
- Payment amount / status derivation
- BMI calculation

### API integration
- Auth login / profile
- RBAC (Owner, Manager, Trainer route access)
- Enquiry CRUD + workflow
- Enrollment → member + payment commitment
- Partial payment + overpayment rejection

### E2E (Playwright)
- Owner login → dashboard
- Invalid login error
- Trainer nav (no Enquiries link)

## Debugging failures

1. **Test DB not ready**
   ```powershell
   pnpm test:setup
   ```

2. **Stale Prisma client**
   ```powershell
   pnpm prisma:generate
   ```

3. **Read last test log**
   ```powershell
   Get-Content test-results\test-run-*.log -Tail 50
   ```

4. **Playwright report**
   ```powershell
   pnpm exec playwright show-report test-results/playwright-report
   ```

5. **Run single test file**
   ```powershell
   pnpm --filter backend exec jest test/api/enquiry.e2e-spec.ts --runInBand
   ```

## CI (future)

```yaml
- run: pnpm test:setup
- run: pnpm test
```

E2E in CI requires building backend and starting services — use `CI=true pnpm test:e2e`.

## Manual UAT

Automated tests complement (not replace) manual UAT checklists in `docs/uat-checklists/`. Use manual UAT for visual UX before releases.
