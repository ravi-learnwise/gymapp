# Phase 6 — Attendance

## Configuration

- [ ] Attendance nav hidden when disabled in Gym Info
- [ ] Attendance nav appears when enabled in Gym Info
- [ ] Disabled module shows message with link to Gym Info config

## Check-in / Check-out

- [ ] Owner/Manager can check in a member
- [ ] Optional batch label saved (Morning/Evening)
- [ ] Duplicate open check-in rejected
- [ ] Check-out records session duration in minutes
- [ ] Today's records listed with filter by date

## Analytics

- [ ] Dashboard shows attendance trend when module enabled
- [ ] Peak hour displayed on dashboard
- [ ] Inactive member count (no visit in 30 days) shown
- [ ] Attendance report available under Reports

## RBAC

- [ ] Trainer cannot check in/out members
- [ ] Trainer cannot access attendance page (Owner/Manager only)

## API

- [ ] `GET /api/attendance/enabled` returns module status
- [ ] `POST /api/attendance/check-in` creates record
- [ ] `PATCH /api/attendance/:id/check-out` completes session

## Build

- [ ] `pnpm build` succeeds
