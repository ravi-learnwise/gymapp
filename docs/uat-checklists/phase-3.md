# Phase 3 — Enrollment

## Enrollment Wizard

- [ ] "Start Enrollment" button visible on open enquiry detail (not Converted/Lost)
- [ ] Wizard opens at `/enrollments/new?enquiryId=...`
- [ ] Step 1 shows all enquiry data read-only (no retyping)
- [ ] Step 2 captures health profile (DOB, height, weight, medical, etc.)
- [ ] BMI auto-calculates when height and weight entered
- [ ] Step 3 selects program, duration, trainer, trial flag, start/end dates
- [ ] End date auto-calculated from duration
- [ ] Step 4 confirms and completes enrollment

## On Completion

- [ ] Member created with MEM-YYYY-NNNN ID
- [ ] Enrollment record created with ENR-YYYY-NNNN ID
- [ ] Active membership created with correct dates
- [ ] Enquiry status changes to Converted
- [ ] Timeline note added for conversion
- [ ] Redirects to member detail page

## Members List

- [ ] Members nav visible for Owner, Manager, Trainer
- [ ] Owner/Manager see all members
- [ ] Trainer sees only assigned members
- [ ] Search by name, mobile, member ID works
- [ ] Program and trainer shown in list

## Member Detail

- [ ] Contact, health profile, and memberships display
- [ ] Source enquiry link works (Owner/Manager)
- [ ] Trainer can view assigned member (read-only)
- [ ] Trainer cannot access unassigned members (403)

## Dashboard

- [ ] Owner/Manager see Members Overview stats
- [ ] Trainer dashboard links to My Members

## API

- [ ] `GET /api/health` returns `"phase": 3`
- [ ] `GET /api/enrollments/prefill/:enquiryId` returns enquiry data
- [ ] `POST /api/enrollments` creates member + membership
- [ ] Duplicate enrollment on same enquiry rejected

## Build

- [ ] `pnpm build` succeeds with no errors
