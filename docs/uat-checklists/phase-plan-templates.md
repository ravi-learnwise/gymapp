# UAT Checklist — Training and Diet Plan Templates

Staff-facing gym-level templates for weekly training and diet plans. Templates are optional when assigning a plan to a member.

## Setup

- [ ] Migration `20260829130000_plan_templates` applied
- [ ] Backend and frontend build successfully
- [ ] Log in as trainer@gym.com / Trainer@123 (assigned member)
- [ ] Also verify as manager@gym.com and owner@gym.com

## Training plan templates (master)

- [ ] Nav shows **Training Plan Templates** for Owner, Manager, and Trainer
- [ ] Create a template: name, description, weekday exercises/sets
- [ ] Save, reload, content persists
- [ ] Edit an existing template
- [ ] Deactivate (confirm dialog) — template stays in the list as Inactive
- [ ] Inactive templates do not appear in the member-plan template picker

## Diet plan templates (master)

- [ ] Nav shows **Diet Plan Templates** for Owner, Manager, and Trainer
- [ ] Create a template: name, objective, meals/foods/alternatives
- [ ] Copy day / copy meal works in the template editor (local, no member)
- [ ] Deactivate removes it from the member-plan picker

## Assign from template

- [ ] Member → Training Card → New card → **Use a template**
- [ ] Picker search works; week preview shows which days have exercises
- [ ] Selecting a template fills name (`{template} for {member}`), description, and week
- [ ] Trainer can edit loads/reps before save
- [ ] Save draft, then publish — plan is ACTIVE; review date saved
- [ ] Only one ACTIVE training card per member
- [ ] Same flow for Diet Plan (objective filter in picker)

## Start from scratch (no template)

- [ ] New card without picking a template still works (empty week)
- [ ] Publish opens dialog: “Also save this as a training plan template?”
- [ ] **Yes** + name: member plan ACTIVE **and** new template appears on the master list
- [ ] **No**: member plan ACTIVE, no new template
- [ ] Repeat for diet plan from scratch

## Do not prompt

- [ ] Publishing a plan that was started from a template does **not** show the save-as-template dialog
- [ ] Publishing a **revision** of an existing member plan does **not** show the dialog

## Isolation and fallback

- [ ] Edit a template after assigning it — the member’s assigned plan does not change
- [ ] **Save as template** on the member editor works as a manual fallback
- [ ] Trainer cannot open/create a plan for an unassigned member (403)

## Out of scope

- Meal-only templates
- Copying one member’s plan to another member
- Member mobile view
- Calories / macros
