# Phase 7 — Dashboard & Reports

## Dashboard (Owner/Manager)

- [ ] Period selector: daily, weekly, monthly, yearly
- [ ] Active members, new enquiries, conversion rate, pending payments shown
- [ ] Owner sees revenue, transaction count, revenue by program
- [ ] Owner sees renewal rate
- [ ] Program enrollments breakdown shown
- [ ] Attendance section shown when module enabled
- [ ] Link to Reports page works

## Trainer

- [ ] Trainer dashboard shows portal message only (no metrics)
- [ ] Link to assigned members works

## Reports

- [ ] Reports nav visible for Owner and Manager
- [ ] Period and report type selectors work
- [ ] Enquiries report: new count, conversion, list
- [ ] Enrollments report: count and list
- [ ] Payments report: status summary and list
- [ ] Referrals report: count, converted, list
- [ ] Attendance report: analytics when module enabled
- [ ] Financial report: Owner only (Manager gets 403)
- [ ] Owner can export report as JSON

## API

- [ ] `GET /api/dashboard/summary?period=monthly`
- [ ] `GET /api/dashboard/reports?period=monthly&type=enquiries`
- [ ] `GET /api/health` returns `"phase": 7`

## Build

- [ ] `pnpm build` succeeds
