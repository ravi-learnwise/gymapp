# UAT Checklist — Diet Plan Module (V1)

Staff-only V1: trainer builds and publishes diet plans; no member portal yet.

## Setup

- [ ] Migration `20260818150000_diet_plan_module` applied
- [ ] Backend and frontend build successfully
- [ ] Log in as trainer@gym.com / Trainer@123 (assigned member)

## Create & publish

- [ ] From member detail, open **Diet Plan** → **New plan**
- [ ] Plan name, objective, review date, general instructions, hydration goal save correctly
- [ ] Member diet type, allergies, medical notes visible in sidebar
- [ ] Add meals (Breakfast, Lunch, etc.) with foods (name, qty, unit, preparation)
- [ ] Add food alternative (OR option)
- [ ] Vegetarian member shows soft warning for non-veg food names
- [ ] Save draft persists after reload
- [ ] Publish sets plan ACTIVE; only one active plan per member

## Weekly structure

- [ ] All 7 weekday tabs work (Sun–Sat)
- [ ] Day type: Plan available / Rest-recovery / No specific plan
- [ ] Reorder meals with ↑↓
- [ ] Remove meal with confirmation

## Copy / reuse

- [ ] Copy Monday to Tue–Fri (replace existing) — independent copies
- [ ] Copy individual meal to other weekdays
- [ ] Editing copied day does not change source day

## Version lifecycle

- [ ] Version history on member diet page lists all versions
- [ ] Create revision from active plan → new DRAFT vN+1
- [ ] Archive (Manager+) removes plan from active use
- [ ] Previous versions remain in history

## RBAC & dashboard

- [ ] Trainer cannot edit diet plan for unassigned member (403)
- [ ] Dashboard shows diet plans due for review (within 7 days)
- [ ] Trainer dashboard shows diet due-review count

## Out of scope (V1)

- Member read-only diet view / mobile app
- Food library admin
- Calorie / macro calculation
- Copy plan between members
