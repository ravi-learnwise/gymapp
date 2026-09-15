# Phase V2 UAT: RBAC, Multi-Program Enrollment, Training Cards

## Prerequisites

- Branch `ravi-dev` deployed locally with MySQL
- Run `pnpm prisma:migrate` and `pnpm prisma:seed`
- Test accounts: owner@gym.com, manager@gym.com, trainer@gym.com

## RBAC hierarchy

- [ ] Owner can access Users, config writes, enquiries, payments list, reports
- [ ] Manager can access enquiries, payments, reports, config (read-only programs/discounts)
- [ ] Manager cannot access Users or deactivate programs
- [ ] Trainer sees only Members, Attendance (if enabled), Profile, Dashboard
- [ ] Trainer cannot access `/enquiries`, `/payments` list, `/config/*`, `/reports`, `/users`

## Trainer member access

- [ ] Trainer login → Members list shows only assigned members
- [ ] Trainer member detail hides mobile, email, address, alternate contact, profession
- [ ] Trainer can view health profile, memberships, assessments (read-only)
- [ ] Trainer can check-in/out assigned members (when attendance enabled)

## Multi-program enrollment

- [ ] Programs config shows Enrollment type (Independent / Add-on)
- [ ] Owner can create add-on program (e.g. Personal Training)
- [ ] From member detail, Add Program creates second ACTIVE membership
- [ ] Add-on without covering independent membership shows non-blocking warning banner
- [ ] Member list shows +N badge when multiple active programs
- [ ] Payment commitment created for new membership

## Trainer payment & enroll

- [ ] Trainer can Add Program on assigned member only
- [ ] Trainer sees payments on member detail and can open payment detail
- [ ] Trainer can record payment transaction on assigned member
- [ ] Trainer cannot access global payments list

## Exercise library

- [ ] Owner/Manager can access `/config/exercises`
- [ ] Seed data loads ~35 exercises
- [ ] Owner can add/deactivate exercises; Manager read-only

## Training cards

- [ ] Member detail → Training Card link works
- [ ] Create new training card (draft) with weekday tabs
- [ ] Add exercises from library, configure sets/reps/weight
- [ ] Save draft and publish → active card supersedes prior active
- [ ] Version history lists draft/active/superseded cards
- [ ] Dashboard shows due review count (cards with reviewDate within 7 days)

## Build

- [ ] `pnpm build` passes in repo root
