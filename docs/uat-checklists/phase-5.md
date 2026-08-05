# Phase 5 — Fitness Assessment

## Enrollment baseline

- [ ] New enrollment with height/weight creates initial fitness assessment record
- [ ] Assessment note indicates "Initial assessment at enrollment"
- [ ] Member profile height/weight/BMI updated from enrollment data

## Assessment history

- [ ] Member detail page shows Fitness Assessments section
- [ ] Historical assessments listed newest first
- [ ] Each record shows date, assessor, measurements, goals, notes
- [ ] Trainer can view assessments for assigned members (read-only)
- [ ] Trainer cannot create new assessments

## New assessment

- [ ] Owner/Manager can add new assessment from member detail
- [ ] Height + weight auto-calculates BMI
- [ ] Optional body measurements (waist, chest, hip, arm, thigh, body fat) saved
- [ ] Medical history and fitness goals saved
- [ ] Latest assessment updates member profile snapshot fields

## API

- [ ] `GET /api/members/:id/assessments` returns history
- [ ] `POST /api/members/:id/assessments` creates record (Owner/Manager)

## Build

- [ ] `pnpm build` succeeds
