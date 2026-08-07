# Pre-Module Fixes — UAT Checklist

Manual smoke tests for the nine pre-module improvements.

## 1. Password visibility toggle

- [ ] Login page: eye icon toggles password field between hidden and visible
- [ ] Reset password page: same toggle works on new password fields
- [ ] Screen reader: aria-label switches between "Show password" and "Hide password"

## 2. Enquiry form validation

- [ ] Submit empty form → field errors on name, mobile, lead source, date of enquiry
- [ ] Invalid mobile (e.g. `12345`) → India mobile format error
- [ ] Valid 10-digit mobile starting with 6–9 → saves successfully
- [ ] Optional alternate contact validated when provided
- [ ] Backend rejects invalid mobile with 400 response

## 3. Enquiry metrics — date range (MTD default)

- [ ] Enquiry list: stat cards show New, Converted, Lost, Open (absolute counts)
- [ ] Date range picker defaults to month-to-date
- [ ] Changing dates and applying updates stat cards
- [ ] Dashboard: MTD enquiry counts replace conversion rate percentage
- [ ] No `conversionRate` shown on enquiry stats API consumer pages

## 4. Expiring memberships

- [ ] Dashboard widget shows four buckets (7 / 15 / 30 / beyond 30 days)
- [ ] Clicking a bucket opens filtered expiring memberships page
- [ ] Expiring page: bucket tabs filter the list
- [ ] Member name links to member detail
- [ ] Nav item "Renewals" visible for Owner/Manager

## 5. Program duration on enquiry

- [ ] Enquiry form: duration dropdown disabled until program selected
- [ ] Duration options show label and price
- [ ] Enquiry detail shows selected duration
- [ ] Enrollment wizard pre-fills duration from enquiry (not just first active)

## 6. Follow-up reminder management

- [ ] Schedule reminder on open enquiry
- [ ] Mark reminder Done → strikethrough
- [ ] Undo on completed reminder reopens it
- [ ] Edit reminder date/note inline
- [ ] Delete reminder with confirmation
- [ ] No edit/delete on CONVERTED or LOST enquiries

## 7. Rich data tables

- [ ] Enquiries list: sort by clicking column headers (▲/▼)
- [ ] Enquiries list: column picker toggles optional columns; preference persists
- [ ] Members list: membership status filter, sort, pagination
- [ ] Payments list: status + outstanding filter, sort, pagination

## 8. Flat discount (exclusive with %)

- [ ] Enquiry form: entering flat ₹ clears percentage discount category
- [ ] Selecting discount category clears flat amount
- [ ] Backend rejects setting both at once
- [ ] Enquiry detail shows flat discount when set
- [ ] Enrollment confirm step shows applied discount type and amount
- [ ] Payment commitment uses flat amount when set

## 9. Receipt-only print

- [ ] Payment detail "Open receipt" opens new tab (no sidebar/nav)
- [ ] Print button triggers browser print dialog
- [ ] Print CSS hides buttons; receipt fills page width
- [ ] Receipt shows gym name, receipt #, member, amounts, GST, balance
