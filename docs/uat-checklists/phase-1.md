# Phase 1 — Authentication & System Configuration

## Login

- [ ] Login as Owner: `owner@gym.com` / `Owner@123` → redirects to dashboard
- [ ] Login as Manager: `manager@gym.com` / `Manager@123`
- [ ] Login as Trainer: `trainer@gym.com` / `Trainer@123`
- [ ] Invalid credentials show error message
- [ ] Sign out returns to login page

## RBAC — Sidebar visibility

- [ ] Owner sees: Dashboard, Gym Info, Programs, Discounts, Offers, Users, Profile
- [ ] Manager sees: Dashboard, Gym Info, Programs, Discounts, Offers, Profile (no Users)
- [ ] Trainer sees: Dashboard, Profile only

## Gym Configuration

- [ ] Owner can edit gym name, address, GST, logo URL, attendance toggle
- [ ] Manager can view gym info but fields are read-only
- [ ] Changes persist after page refresh

## Programs / Discounts / Offers

- [ ] Programs list shows seeded "General Fitness" with durations
- [ ] Owner can add new program, discount category, offer category
- [ ] Manager can view lists but cannot add (no add form shown)

## User Management (Owner only)

- [ ] `/users` accessible by Owner
- [ ] Manager/Trainer navigating to `/users` redirected to dashboard
- [ ] Owner can create a new Manager user

## Profile

- [ ] Any role can update first name, last name, phone
- [ ] Change password works with correct current password

## Password Reset

- [ ] Forgot password form submits successfully
- [ ] Reset link printed in backend console
- [ ] Reset password with token works

## API (Swagger)

- [ ] `POST /api/auth/login` works
- [ ] Protected endpoints return 401 without token
- [ ] `GET /api/config/gym` works with Manager token

## Build

- [ ] `pnpm build` succeeds

_Date tested:_ ___________
_Tester:_ ___________
