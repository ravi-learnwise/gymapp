Yes. I would make the **Diet Plan** deliberately different from the Training Card in one important respect:

> **The trainer thinks in terms of meals/intake occasions; the member thinks in terms of “what should I eat, how much, and when?”**

The system should therefore avoid becoming a calorie-counting or dietitian-grade nutrition platform in V1. It should capture enough structure to provide a clear, personalized prescription while keeping creation extremely fast.

The strongest design, in my view, is:

**Diet Plan → Day → Meal/Intake → Food Items**

with **meal templates and copy-day functionality** doing most of the work for the trainer.

For example:

```text
Monday
│
├── Early Morning
│   └── Warm water — 300 ml
│
├── Breakfast
│   ├── Oats — 50 g
│   ├── 2 boiled eggs
│   └── 1 banana
│
├── Mid-Morning
│   └── Apple — 1 medium
│
├── Lunch
│   ├── Rice — 1 cup
│   ├── Dal — 1 bowl
│   ├── Vegetables — 1 bowl
│   └── Curd — 1 cup
│
├── Pre-Workout
│   └── Banana — 1
│
├── Post-Workout
│   └── Whey protein — 1 scoop
│
└── Dinner
    ├── Roti — 2
    ├── Paneer — 100 g
    └── Salad — 1 bowl
```

But I would **not** make "food item" a complicated nutritional database in the first version.

Here is the specification I would put into your project.

# Diet Plan Management

## 1. Feature Overview

The Diet Plan module allows a trainer or nutritionist to create, assign, publish and revise a structured dietary plan for an individual gym member.

The primary purpose is to give the member a clear, practical and easy-to-follow daily eating plan.

The system should answer four questions for the member:

1. **When should I eat?**
2. **What should I eat?**
3. **How much should I eat?**
4. **Are there any special instructions?**

The system should support a complete weekly plan from **Sunday through Saturday**.

However, the trainer should not be forced to independently create seven days of content.

The primary workflow should therefore be:

> **Create one day's plan → Copy it to other days → Make small modifications where necessary.**

This is critical for usability.

A typical gym diet plan may contain several intake occasions throughout the day, such as:

* Early Morning
* Breakfast
* Mid-Morning
* Lunch
* Evening / High Tea
* Pre-Workout
* Post-Workout
* Dinner
* Bedtime
* Supplements
* Other

Not every member will have all of these.

The trainer should only add the intake occasions that are relevant to that member.

---

# 2. Product Philosophy

The Diet Plan feature should **not attempt to become a clinical dietetics or comprehensive nutrition-management platform in its first version**.

The goal is guided dietary planning for gym members.

The system should prioritize:

* Simplicity
* Clarity
* Practicality
* Personalization
* Easy modification
* Easy reuse
* Mobile readability

The trainer should be able to create a useful daily plan in a few minutes.

The member should be able to understand today's diet plan immediately without needing to interpret nutritional terminology.

---

# 3. Core Data Hierarchy

The recommended hierarchy is:

```text
Member
   │
   └── Diet Plan
          │
          ├── Sunday
          │     ├── Meal / Intake
          │     │      ├── Food / Item
          │     │      └── Food / Item
          │     │
          │     └── Meal / Intake
          │
          ├── Monday
          │     ├── Meal / Intake
          │     └── Meal / Intake
          │
          ├── Tuesday
          ├── Wednesday
          ├── Thursday
          ├── Friday
          └── Saturday
```

Conceptually:

**Diet Plan → Day → Intake Occasion → Food Items**

This structure should be used consistently in the database, API and UI.

---

# 4. Diet Plan

A Diet Plan represents a complete dietary prescription assigned to a member.

## Core Fields

* Diet Plan ID
* Member ID
* Plan Name
* Objective
* Description
* Effective From
* Review Date
* Status
* Version
* Previous Version ID
* Created By
* Created Date
* Last Updated By
* Last Updated Date

## Suggested Status

* Draft
* Active
* Superseded
* Archived

Only one Diet Plan version should normally be Active for a member.

---

# 5. Diet Plan Objective

The trainer/nutritionist should select the primary objective.

Suggested options:

* General Fitness
* Weight Management
* Fat Loss
* Muscle Gain
* Strength / Performance
* Healthy Eating
* Sports / Athletic Performance
* Medical / Special Diet
* Other

"Medical / Special Diet" should be treated carefully.

The application should not automatically prescribe therapeutic diets. The system is a planning and record-keeping tool; it should not independently diagnose conditions or generate medical dietary advice.

---

# 6. Diet Plan Name

Examples:

* General Fitness — Month 1
* Fat Loss — Phase 1
* Muscle Gain — Month 2
* Balanced Diet — Week 1
* Training Nutrition — August

The trainer should be able to provide a meaningful name, but naming should not make the workflow cumbersome.

---

# 7. Weekly Structure

Every Diet Plan contains seven day buckets:

| Day       | Plan              |
| --------- | ----------------- |
| Sunday    | Custom daily diet |
| Monday    | Custom daily diet |
| Tuesday   | Custom daily diet |
| Wednesday | Custom daily diet |
| Thursday  | Custom daily diet |
| Friday    | Custom daily diet |
| Saturday  | Custom daily diet |

A day can also be marked:

* Plan Available
* Rest / Recovery Day
* No Specific Plan

However, "No Specific Plan" should not mean that the member is expected to interpret an empty screen.

The member should see a clear message.

---

# 8. The Most Important UX Feature — Copy Day

Creating seven similar diet plans manually would be unnecessarily tedious.

The trainer should therefore have an obvious:

**Copy Day**

action.

Example:

```text
Monday

[ Copy Day ]

Copy Monday to:
☐ Tuesday
☐ Wednesday
☐ Thursday
☐ Friday
☐ Saturday
☐ Sunday

[ Copy ]
```

The trainer can select one or multiple days.

---

# 9. Copy-Day Behaviour

When a trainer copies Monday to Tuesday:

```text
Monday
  Breakfast
  Lunch
  Pre-workout
  Dinner
```

becomes:

```text
Tuesday
  Breakfast
  Lunch
  Pre-workout
  Dinner
```

The copied content should be an independent copy.

Changing Tuesday later must NOT change Monday.

This is extremely important.

The system should copy the prescription, not create a live reference to Monday.

---

# 10. Copy Multiple Days

The trainer should also be able to perform:

```text
Copy Monday → Tuesday, Wednesday, Thursday, Friday
```

in one action.

This will probably be the most common workflow.

---

# 11. Copy Existing Day and Replace

If Tuesday already contains a plan and the trainer selects:

> Copy Monday to Tuesday

the system should warn:

> Tuesday already has a diet plan. Replace it?

Options:

* Cancel
* Replace
* Copy and Add

For the first version, **Replace** is sufficient.

An accidental replacement should require explicit confirmation.

---

# 12. Copy Week

A useful secondary action is:

**Copy Day to Entire Week**

Example:

```text
Monday plan

[ Apply to Week ]

☑ Tuesday
☑ Wednesday
☑ Thursday
☑ Friday
☑ Saturday
☐ Sunday

[ Apply ]
```

This is especially useful when the member follows essentially the same diet every day.

---

# 13. Copy Individual Meal

The system should also allow copying an individual meal/intake occasion.

Example:

```text
Monday
Breakfast

[ Copy ]

Copy Breakfast to:
Tuesday
Wednesday
Thursday
Friday
Saturday
```

This is useful when breakfast remains constant but lunch and dinner vary.

This feature should be included if it does not significantly complicate implementation.

---

# 14. Meal / Intake Occasion

A day consists of multiple **Intake Occasions**.

I recommend calling these "Meals" internally only if convenient, but the user-facing term should preferably be:

**Meal / Intake**

because supplements and pre-workout intake are not necessarily meals.

Each occasion should have:

* Occasion Type
* Approximate Time
* Title / Label
* Food Items
* Instructions
* Optional Notes
* Display Order

---

# 15. Standard Intake Occasions

The system should provide a predefined list.

### Morning

* Early Morning
* Breakfast
* Mid-Morning

### Main Meals

* Lunch
* Evening / High Tea
* Dinner
* Bedtime

### Workout Related

* Pre-Workout
* Post-Workout

### Other

* Supplement
* Hydration
* Other

The trainer can add an occasion when necessary.

---

# 16. Do Not Force Fixed Meal Times

The application should not require:

> Breakfast = 8:00 AM

because meal timings vary by person.

Instead:

```text
Breakfast
Approx. 8:00 AM
```

The time should be optional.

The trainer can also write:

* After waking
* 30–60 min before workout
* Within 1 hour after workout
* Before bedtime

This is often more useful than forcing a precise clock time.

---

# 17. Intake Occasion UI

Example:

```text
BREAKFAST
Approx. 8:00 AM

Oats             50 g
Milk             250 ml
Banana           1 medium
Eggs             2

Trainer Note:
Prefer low-sugar milk.

[ Edit ]
[ Copy ]
```

The member sees the same information in a clean mobile-friendly layout.

---

# 18. Food Item

A Food Item represents one prescribed dietary item.

Examples:

* Oats
* Banana
* Rice
* Roti
* Dal
* Paneer
* Chicken
* Fish
* Curd
* Milk
* Nuts
* Salad
* Whey Protein

Each food item should capture:

* Food name
* Quantity
* Unit
* Optional preparation/style
* Optional notes

---

# 19. Quantity

Quantity is important because:

> "Eat rice"

is much less useful than:

> "Cooked rice — 1 cup"

The trainer should therefore be able to specify a quantity.

Examples:

```text
2
100 g
1 cup
1 bowl
250 ml
1 medium
1 serving
```

The UI should not force the trainer to use grams for every food.

---

# 20. Units

Provide a practical list of units.

### Weight

* g
* kg

### Volume

* ml
* litre
* cup
* glass
* bowl

### Count

* piece
* serving
* slice
* egg
* roti
* fruit

### Approximate Household Measures

* teaspoon
* tablespoon
* handful

The trainer should be able to enter a custom unit if required.

---

# 21. Preparation / Form

The same food can have different nutritional meanings depending on preparation.

Therefore, optionally capture:

**Preparation / Form**

Examples:

* Cooked
* Raw
* Boiled
* Steamed
* Grilled
* Baked
* Fried
* Low-oil
* Unsweetened
* Other

Example:

```text
Rice
Quantity: 1 cup
Form: Cooked
```

or:

```text
Chicken
Quantity: 150 g
Preparation: Grilled
```

This field should remain optional.

---

# 22. Food Item Notes

The trainer can add a small instruction.

Examples:

* No added sugar
* Use minimal oil
* Prefer whole grain
* Remove skin
* Unsweetened
* Soak overnight

The notes should be short.

Long dietary explanations belong at the Diet Plan or Meal level.

---

# 23. Food Alternatives

This is a highly useful feature and should be considered part of the initial design.

Members may not always have access to a particular food.

For example:

```text
Breakfast

Oats — 50 g

Alternative:
Poha — 1 bowl
```

Or:

```text
Protein source:
Chicken — 150 g

Vegetarian alternative:
Paneer — 100 g
```

The trainer should be able to specify one or more alternatives.

However, alternatives should not become a complicated food-substitution engine.

For the first version:

> **Trainer manually specifies alternatives.**

Do not attempt automatic calorie/protein-equivalent substitutions yet.

---

# 24. Recommended Food Item Presentation

Trainer UI:

```text
Breakfast

+ Add Food

┌──────────────────────────────────┐
│ Oats                             │
│ 50 g                             │
│ Cooked / prepared as instructed  │
│                                  │
│ Alternative: Poha — 1 bowl       │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Banana                           │
│ 1 medium                         │
└──────────────────────────────────┘
```

Member UI:

```text
Breakfast
Around 8:00 AM

🥣 Oats
50 g

🍌 Banana
1 medium

Alternative:
Poha — 1 bowl
```

---

# 25. Dietary Preferences

The diet plan should be aware of the member's dietary preference.

The member profile/enrollment already captures diet type such as:

* Vegetarian
* Non-Vegetarian
* Vegetarian with Egg

The Diet Plan should display this information to the trainer.

Example:

```text
Member:
Rahul

Diet Type:
Vegetarian with Egg
```

The system should warn—not automatically block—the trainer if they prescribe something inconsistent.

Example:

> This member is marked Vegetarian. The selected food appears to be non-vegetarian. Please verify.

The trainer should be able to override the warning when appropriate.

---

# 26. Allergies and Medical Information

Relevant member information should be visible to the trainer/nutritionist while preparing a plan.

Examples:

* Allergies
* Medical History
* Dietary Restrictions

The system should provide a visible caution area:

```text
⚠ Member Considerations

Milk allergy
Avoid dairy products.
```

The application should not automatically infer medical restrictions that were not recorded.

---

# 27. Diet Plan Notes

At the top of the plan, the trainer should be able to provide general instructions.

Examples:

> Drink adequate water throughout the day.

> Prefer freshly prepared meals.

> Avoid sugary beverages.

> Follow the prescribed quantities as closely as practical.

This should be displayed before the daily meal schedule.

---

# 28. Hydration

Hydration should be represented as a first-class but simple component.

Rather than forcing water into every meal, allow:

```text
Daily Hydration Goal

2.5 litres/day
```

Optionally:

```text
Morning: 500 ml
Workout period: 500 ml
Remaining through the day
```

For MVP, a simple daily target is sufficient.

Do not build a complex water-tracking system yet.

---

# 29. Supplements

Supplements should be represented separately enough to distinguish them from normal food.

Example:

```text
SUPPLEMENTS

Post-Workout

Whey Protein
1 scoop

Creatine
5 g
```

The trainer should be able to specify:

* Supplement name
* Quantity
* Unit
* Timing
* Instructions

The system should not independently recommend supplements.

It should only record what the trainer/nutritionist has prescribed.

---

# 30. Pre-Workout / Post-Workout

Workout-related intake should support contextual timing.

Example:

```text
PRE-WORKOUT

30–60 minutes before workout

Banana — 1 medium
Black coffee — 1 cup

POST-WORKOUT

Within 1 hour after workout

Whey Protein — 1 scoop
```

The member's Training Card and Diet Plan can therefore work together without requiring a hard dependency between the two modules.

---

# 31. Workout-Day Awareness

Some members may have different dietary requirements on workout and rest days.

The initial implementation should allow the trainer to create different weekday plans.

For example:

```text
Monday — Workout
Higher carbohydrate intake

Tuesday — Rest
Different meal structure
```

Do not introduce a separate "Workout Day / Rest Day" rules engine initially.

The weekday structure is sufficient.

A future version can introduce reusable day templates.

---

# 32. Meal Ordering

The trainer should be able to reorder intake occasions.

Example:

```text
1. Early Morning
2. Breakfast
3. Mid-Morning
4. Lunch
5. Pre-Workout
6. Post-Workout
7. Dinner
8. Bedtime
```

Use drag-and-drop where practical.

The member sees the same order.

---

# 33. Copy and Reuse — Primary Trainer Experience

The Diet Plan editor should make reuse extremely obvious.

Example:

```text
MONDAY

Early Morning
Breakfast
Mid-Morning
Lunch
Pre-Workout
Post-Workout
Dinner

[ Copy Monday ]

[ Apply to multiple days ]
```

When clicked:

```text
Copy Monday's plan to:

☐ Sunday
☐ Tuesday
☐ Wednesday
☐ Thursday
☐ Friday
☐ Saturday

[ Apply ]
```

After copying:

```text
✓ Monday's plan copied to Tuesday, Wednesday and Friday.
```

The trainer can then modify individual days.

---

# 34. Copy From Any Day

The trainer should not have to copy only Monday.

Every day should have:

**Copy Day**

Example:

```text
Wednesday
[ Copy Day ]
```

The trainer can copy Wednesday to any other day.

---

# 35. Copy Individual Intake

Each meal/intake should have:

```text
⋮
Copy to other days
```

Example:

```text
Monday → Breakfast

Copy Breakfast to:
☑ Tuesday
☑ Wednesday
☑ Thursday
☐ Friday
☐ Saturday
☐ Sunday
```

This significantly reduces repetitive data entry.

---

# 36. Copy Individual Food Item

This is optional.

A trainer could eventually copy:

> Oats — 50 g

into another meal.

However, this is not essential to the initial implementation.

Prioritize:

1. Copy entire day
2. Copy multiple days
3. Copy individual meal

before implementing individual-item copying.

---

# 37. Diet Plan Templates

A future enhancement should allow trainers/nutritionists to create reusable templates.

Example:

```text
Templates

General Fitness — Vegetarian
Weight Loss — Vegetarian
Muscle Gain — Non-Vegetarian
General Fitness — Eggitarian
```

Workflow:

```text
Create Diet Plan
    ↓
Start from Template
    ↓
Customize for Member
    ↓
Publish
```

This could eventually become one of the biggest productivity improvements.

It should not be confused with copying one member's plan to another member.

---

# 38. Copy Plan Between Members

This is a potentially useful future feature.

A trainer may have several members with similar goals.

Example:

```text
Copy Diet Plan From:
Member A

Apply To:
Member B
```

However, this should require explicit confirmation because diet plans can be highly individual.

The copied plan should always become an independent plan.

Never create a shared live plan between members.

---

# 39. Calorie and Macronutrient Tracking

This should be deliberately **optional / future scope**.

The initial Diet Plan does not need to calculate:

* Calories
* Protein
* Carbohydrates
* Fat
* Fibre
* Micronutrients

Why?

Because this immediately turns a simple guided diet planner into a nutritional-analysis product.

The first version should allow the trainer to prescribe practical quantities without requiring every food item to exist in a detailed nutrition database.

---

# 40. Optional Nutritional Summary — Future

Eventually the system can support:

```text
Daily Target

Calories: 2,100 kcal
Protein: 130 g
Carbohydrates: 220 g
Fat: 65 g
Fibre: 30 g
```

and calculate an estimated intake from food quantities.

This requires:

* Standardized food database
* Nutritional values
* Serving conversions
* Recipe handling
* Cooking-weight vs raw-weight handling
* Brand-specific foods

That complexity is not justified for the initial release.

---

# 41. Diet Plan Versioning

Diet Plans should follow the same lifecycle philosophy as Training Cards.

Example:

```text
Diet Plan
   │
   ├── Version 1
   │      Active: 1 Aug – 15 Aug
   │
   └── Version 2
          Active: 16 Aug onwards
```

Never silently overwrite an active historical plan.

When the trainer makes substantial changes, create a new version.

---

# 42. Draft and Publish

The trainer should be able to work on a plan without immediately exposing changes to the member.

States:

```text
Draft
  ↓
Review
  ↓
Publish
  ↓
Active
```

For a simple implementation, Draft → Publish is sufficient.

The member should only see the published active version.

---

# 43. Review Date

Every active Diet Plan should have a review date.

Example:

```text
Effective From:
18 August

Review Date:
15 September
```

The system should remind the trainer/nutritionist when review is approaching.

Suggested default:

* 7 days before
* 3 days before
* On review date

These should eventually be configurable.

---

# 44. Member Mobile App

The member should have a simple:

**My Diet Plan**

screen.

At the top:

```text
My Diet Plan

General Fitness — Month 1

Today's Plan
Monday, 18 Aug
```

Then:

```text
EARLY MORNING
Upon waking

Warm water
300 ml
```

```text
BREAKFAST
Around 8:00 AM

Oats
50 g

Banana
1 medium

Eggs
2
```

```text
LUNCH
Around 1:00 PM

Rice
1 cup

Dal
1 bowl

Vegetables
1 bowl

Curd
1 cup
```

and so on.

---

# 45. Weekday Navigation

The member should be able to switch days easily.

Recommended UI:

```text
SUN  MON  TUE  WED  THU  FRI  SAT
          ↑
        Today
```

Today should be highlighted automatically.

The member can still view other days.

This is important because members may want to prepare meals in advance.

---

# 46. Today's Diet

The mobile home screen should expose today's diet plan.

Example:

```text
Today's Diet

Monday

6 intake occasions

Next:
Lunch — 1:00 PM

[ View Diet Plan ]
```

The application does not need to become a calorie tracker.

It is primarily a prescription viewer.

---

# 47. Member-Friendly Language

The member should see:

> Breakfast

rather than:

> Intake Occasion #2

The trainer should see:

> Breakfast

rather than:

> Meal Entity

Database terminology must never leak into the UI.

---

# 48. Special Instructions

There should be three levels of notes.

### Diet Plan Notes

General instructions for the entire plan.

### Meal Notes

Instructions specific to one meal.

### Food Notes

Instructions specific to one food item.

Example:

```text
Diet Plan:
Drink adequate water.

Lunch:
Prefer freshly prepared food.

Chicken:
Grilled; avoid deep frying.
```

This gives sufficient flexibility without creating dozens of fields.

---

# 49. Food Alternatives — Member Experience

If alternatives exist, the member should see them clearly.

Example:

```text
Breakfast

Oats — 50 g

OR

Poha — 1 bowl
```

Do not show alternatives as if the member must eat both.

The UI should explicitly communicate:

**Choose one option**

where applicable.

---

# 50. Dietary Restrictions Warning

When creating a plan, the system should surface relevant member information.

Example:

```text
Member Dietary Information

Diet:
Vegetarian

Allergies:
Peanuts

Medical Notes:
Available in member profile

⚠ Please verify food selections against these restrictions.
```

The system should not attempt to diagnose or automatically determine suitability.

---

# 51. Food Library

A centralized Food Library can eventually make data entry faster.

However, unlike the Exercise Library, it should remain lightweight initially.

A food entry could contain:

* Food name
* Category
* Common units
* Common serving descriptions

Example:

```text
Banana
Category: Fruit
Units:
- piece
- medium
- large
```

The trainer can still enter a custom food description when necessary.

---

# 52. Food Categories

Useful initial categories:

* Cereals / Grains
* Fruits
* Vegetables
* Dairy
* Eggs
* Meat
* Fish / Seafood
* Legumes / Pulses
* Nuts / Seeds
* Beverages
* Supplements
* Snacks
* Other

These categories are primarily for search and organization.

They should not be used to automatically calculate nutritional values.

---

# 53. Recommended Trainer UI

The Diet Plan editor should look approximately like:

```text
┌─────────────────────────────────────────┐
│ Diet Plan                               │
│ General Fitness — Month 1               │
│                                         │
│ Effective: 18 Aug   Review: 15 Sep      │
└─────────────────────────────────────────┘

SUN   MON   TUE   WED   THU   FRI   SAT
      ●

MONDAY

┌─────────────────────────────────────────┐
│ EARLY MORNING                           │
│                                         │
│ + Add Food                              │
│                                         │
│ Water              300 ml               │
│                                         │
│ [Edit] [Copy]                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ BREAKFAST             ~8:00 AM          │
│                                         │
│ Oats                 50 g               │
│ Banana               1 medium           │
│ Eggs                 2                  │
│                                         │
│ + Add Food                              │
│                                         │
│ [Edit] [Copy]                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ LUNCH                 ~1:00 PM          │
│                                         │
│ Rice                 1 cup              │
│ Dal                  1 bowl             │
│ Vegetables           1 bowl             │
│                                         │
│ + Add Food                              │
└─────────────────────────────────────────┘

[ + Add Meal / Intake ]

───────────────────────────────────────────

[ Copy Monday to other days ]

[ Save Draft ]       [ Publish ]
```

This should feel more like building a simple checklist than filling out a complex nutrition form.

---

# 54. Quick Add Food

The trainer should be able to type:

```text
Oats
```

and select it.

Then:

```text
Quantity: 50
Unit: g
```

rather than navigating through multiple screens.

A good workflow is:

```text
+ Add Food
   ↓
Search food
   ↓
Select
   ↓
Quantity
   ↓
Unit
   ↓
Done
```

---

# 55. Quick Add Multiple Foods

For rapid data entry, the trainer should be able to add several items sequentially without returning to the meal screen each time.

Example:

```text
Breakfast

+ Oats
+ Banana
+ Eggs
+ Milk

[ Done ]
```

This is a significant usability improvement.

---

# 56. Meal Templates

A future enhancement can allow:

```text
Meal Templates

Breakfast — High Protein
Breakfast — Vegetarian
Pre-Workout — Light
Post-Workout — Protein
```

A trainer could then insert a template into a day and modify it.

This is especially useful once the gym has built up a library of common plans.

---

# 57. Database Model

Recommended conceptual structure:

```text
members
   │
   └── diet_plans
          │
          └── diet_plan_days
                 │
                 └── diet_plan_meals
                        │
                        └── diet_plan_food_items
                               │
                               └── diet_food_alternatives
```

Suggested entities:

### `diet_plans`

* id
* member_id
* name
* objective
* description
* effective_from
* review_date
* status
* version
* previous_version_id
* created_by
* created_at
* updated_by
* updated_at

### `diet_plan_days`

* id
* diet_plan_id
* weekday
* day_type
* notes
* display_order

### `diet_plan_meals`

* id
* diet_plan_day_id
* meal_type
* title
* approximate_time
* timing_note
* notes
* display_order

### `diet_plan_food_items`

* id
* diet_plan_meal_id
* food_name
* quantity
* unit
* preparation
* notes
* display_order

### `diet_food_alternatives`

* id
* diet_plan_food_item_id
* alternative_food_name
* quantity
* unit
* notes
* display_order

---

# 58. Important Database Principle

Do NOT store the entire weekly diet plan as one large JSON object.

Avoid:

```text
diet_plans
    plan_json
```

Instead use:

```text
Diet Plan
   ↓
Day
   ↓
Meal
   ↓
Food Item
```

This allows:

* Individual meal editing
* Day copying
* Reporting
* Versioning
* Future nutrition analysis
* Better API responses
* Future food tracking

JSON can still be used as an API representation.

---

# 59. API Design

Suggested endpoints:

```http
GET    /members/{memberId}/diet-plans
POST   /members/{memberId}/diet-plans
GET    /diet-plans/{id}
PUT    /diet-plans/{id}
POST   /diet-plans/{id}/publish
POST   /diet-plans/{id}/archive
GET    /diet-plans/{id}/versions
```

Days:

```http
GET    /diet-plans/{id}/days
PUT    /diet-plan-days/{id}
POST   /diet-plan-days/{id}/copy
```

Meals:

```http
POST   /diet-plan-days/{dayId}/meals
PUT    /diet-plan-meals/{id}
DELETE /diet-plan-meals/{id}
POST   /diet-plan-meals/{id}/copy
```

Food items:

```http
POST   /diet-plan-meals/{mealId}/foods
PUT    /diet-plan-foods/{id}
DELETE /diet-plan-foods/{id}
```

Food Library:

```http
GET    /diet-foods
POST   /diet-foods
PUT    /diet-foods/{id}
```

The exact routes should follow the project's existing API conventions.

---

# 60. Permissions

## Owner

Full access.

* View
* Create
* Edit
* Publish
* Archive
* View history

## Manager

Operational access according to permissions.

## Trainer

* View assigned members
* Create diet plans
* Edit drafts
* Publish plans
* Revise plans
* View relevant member dietary information

## Nutritionist

If the gym supports a dedicated nutritionist role, this role should have full Diet Plan permissions.

The nutritionist should not automatically receive unrestricted access to unrelated gym-management functions.

## Member

Read-only access.

Members can:

* View active plan
* View previous plans if permitted
* View daily meals
* View alternatives
* View instructions

Members cannot modify the prescription.

---

# 61. Trainer vs Nutritionist

The application should support both roles without forcing the product to assume that every gym employs a nutritionist.

A practical approach is:

```text
Trainer
   └── Can create diet plan

Nutritionist
   └── Can create diet plan
```

The plan should record:

```text
Created By
Created By Role
```

This allows the gym to know who prescribed the plan.

---

# 62. Revision History

Example:

```text
Diet Plan — Rahul

Version 1
Created: 1 Aug
Created by: Trainer A
Status: Superseded

Version 2
Created: 18 Aug
Created by: Nutritionist B
Status: Active
```

Previous versions should remain immutable.

---

# 63. Future: Actual Diet Tracking

Do not implement this in the initial feature.

Eventually the application can allow:

```text
Prescribed
      ↓
Member confirms consumption
      ↓
Actually consumed
```

Example:

```text
Breakfast

Oats — 50 g
[✓ Followed]

Banana — 1
[✓ Followed]

Eggs — 2
[ ] Skipped
```

This could eventually provide adherence analytics.

---

# 64. Future: Nutrition Analytics

Once actual food intake is captured, the system could calculate:

* Calories consumed
* Protein
* Carbohydrates
* Fat
* Fibre
* Adherence
* Meal consistency

But this should only be introduced after a proper nutritional database and calculation model are established.

---

# 65. Future: AI

AI may eventually help with:

* Drafting meal plans
* Suggesting alternatives
* Generating grocery lists
* Identifying repetitive meals
* Summarizing adherence
* Suggesting plan modifications for professional review

AI should **not autonomously prescribe medical diets**.

Any AI-generated dietary suggestion should be clearly treated as a draft/recommendation requiring professional review.

---

# 66. MVP Scope

The initial Diet Plan implementation should include:

### Diet Plan

* Create plan
* Assign to member
* Objective
* Effective date
* Review date
* General instructions
* Draft / Publish
* Version history

### Weekly Planning

* Sunday–Saturday
* Day-specific plans
* Rest / no-plan days
* Reordering

### Meals / Intake

* Standard meal/intake types
* Custom meal type
* Approximate time
* Timing instructions
* Meal notes
* Reordering

### Food

* Food name
* Quantity
* Unit
* Preparation
* Notes
* Alternatives

### Trainer Productivity

* Copy entire day
* Copy day to multiple weekdays
* Replace existing day with confirmation
* Copy individual meal
* Quick-add food

### Member App

* Today's diet
* Weekday navigation
* Meal timeline
* Quantities
* Alternatives
* Instructions
* Hydration target
* Supplements

### Safety / Context

* Dietary preference visibility
* Allergy visibility
* Medical-history visibility
* Basic conflict warning

---

# 67. Explicitly Defer

Do NOT allow the following to delay the first implementation:

* Comprehensive calorie database
* Automatic calorie calculation
* Macronutrient optimization
* Micronutrient analysis
* Recipe database
* Grocery management
* Automatic food substitutions
* Barcode scanning
* Meal photography
* Food recognition
* Diet adherence tracking
* AI diet generation
* Medical diet engine
* Supplement recommendation engine

These are separate products/features.

---

# 68. Recommended Development Sequence

## P1 — Diet Plan Data Model

Implement:

1. Diet Plan
2. Day
3. Meal / Intake
4. Food Item
5. Alternative
6. Version

---

## P2 — Trainer Editor

Implement:

1. Create plan
2. Select weekday
3. Add meal
4. Add food
5. Quantity
6. Unit
7. Notes
8. Reorder

---

## P3 — Copy / Reuse

Implement:

1. Copy day
2. Copy day to multiple days
3. Replace confirmation
4. Copy individual meal

This should be treated as a **high-priority feature**, not a nice-to-have.

---

## P4 — Member App

Implement:

1. Today's diet
2. Weekday navigation
3. Meal display
4. Food quantities
5. Alternatives
6. Notes
7. Hydration
8. Supplements

---

## P5 — Lifecycle

Implement:

1. Publish
2. Review date
3. Reminders
4. Versioning
5. Archive

---

## P6 — Future Enhancements

Later:

1. Templates
2. Food library
3. Meal templates
4. Actual consumption
5. Nutrition analytics
6. Calorie/macronutrient calculation
7. AI assistance

---

# 69. Acceptance Criteria

The Diet Plan feature is complete when:

* A trainer/nutritionist can create a Diet Plan for a member.
* The plan supports Sunday through Saturday.
* A day can contain multiple intake occasions.
* Intake occasions can be reordered.
* Standard intake types are available.
* Custom intake types can be created.
* Approximate meal timing can be specified.
* Each intake can contain multiple food items.
* Each food item supports quantity and unit.
* Preparation instructions can be added.
* Food-specific notes can be added.
* Alternatives can be specified.
* General diet instructions can be added.
* Hydration goals can be recorded.
* Supplements can be recorded.
* A complete day can be copied to one or multiple other weekdays.
* Copying creates an independent copy.
* Existing target-day content requires confirmation before replacement.
* Individual meals can be copied where supported.
* The trainer can create a draft.
* The trainer can publish the plan.
* The member sees only the active published plan.
* The member can navigate Sunday–Saturday.
* Today's plan is easy to access.
* Dietary preferences and relevant restrictions are visible to the trainer.
* Previous plan versions are preserved.
* Review dates can be configured.
* Review reminders can be generated.
* The data model does not depend on a calorie database.
* The architecture can support future nutritional analysis without redesigning the basic Diet Plan structure.

---

# 70. Final Product Direction

The Diet Plan should ultimately feel like a **simple digital diet chart**, not a nutrition-science application.

The trainer experience should be:

```text
Create Plan
     ↓
Build Monday
     ↓
Copy Monday
→ Tue
→ Wed
→ Thu
→ Fri
     ↓
Modify individual meals
     ↓
Review
     ↓
Publish
```

The member experience should be:

```text
My Diet

TODAY — MONDAY

Early Morning
     ↓
Breakfast
     ↓
Mid-Morning
     ↓
Lunch
     ↓
Pre-Workout
     ↓
Post-Workout
     ↓
Dinner
     ↓
Bedtime
```

The key product principle is:

> **Capture enough structure to make the diet actionable, without forcing the trainer to become a data-entry operator.**

The system should make the common case extremely fast:

**Select meal → add food → enter quantity → repeat → copy day → publish.**

Everything more sophisticated—calorie calculation, macros, food databases, substitutions, adherence tracking, AI recommendations and medical nutrition workflows—should be layered on later without compromising this simple core experience.
