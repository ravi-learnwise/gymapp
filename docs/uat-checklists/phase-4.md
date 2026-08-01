# Phase 4 — Payment Management

## Config Edit (Programs, Discounts, Offers)

- [ ] Owner can edit program name and description
- [ ] Owner can add, edit, and deactivate program durations
- [ ] Owner can edit discount name, description, and percentage
- [ ] Owner can edit offer name and description
- [ ] Owner can deactivate discount/offer categories
- [ ] Manager sees config as read-only (no Edit buttons)

## Payment Commitment (auto on enrollment)

- [ ] New enrollment creates payment commitment with program fee
- [ ] Enquiry discount auto-applied to commitment
- [ ] Status starts as Pending

## Payment List

- [ ] Payments nav visible for Owner and Manager
- [ ] List shows member, program, amounts, status
- [ ] Filter by status works
- [ ] Outstanding filter works
- [ ] Search by member name/mobile works

## Record Payment

- [ ] Record partial payment updates status to Partial
- [ ] Full payment updates status to Paid
- [ ] Overpayment rejected
- [ ] Receipt number generated (RCP-YYYY-NNNN)
- [ ] Payment history shows all transactions

## Receipt

- [ ] View receipt shows gym info, member, amounts, GST
- [ ] Print receipt works

## Commitment Management

- [ ] Update discount, GST %, commitment date, notes
- [ ] Pending amount recalculates correctly

## Reminders

- [ ] Schedule payment due reminder
- [ ] Mark reminder as Done
- [ ] Dashboard shows due reminder count

## Member Detail

- [ ] Payment summary linked from member page (Owner/Manager)

## Dashboard

- [ ] Payment alerts section shows outstanding amount
- [ ] Link to outstanding payments works

## API

- [ ] `GET /api/health` returns `"phase": 4`

## Build

- [ ] `pnpm build` succeeds
