Below is a **Cursor-ready specification note** for the Training Card feature. I have expanded the original SRS requirement into a practical fitness-programming model, while keeping the first implementation deliberately manageable. The original SRS calls for training-card creation, workout-plan management, exercise details, sets/repetitions, review reminders and revision history as a Version 2 feature. 

# Training Card Management

## Functional, UX and Technical Specification

**Module:** Training Card Management
**Priority:** High — Version 2
**Primary Users:** Trainers, Managers, Members
**Purpose:** Create, assign, review and display structured weekly workout routines for individual gym members.

---

# 1. Feature Overview

The Training Card module allows a trainer to create a structured workout program for an individual member.

A complete training program consists of **seven weekday buckets — Sunday through Saturday**.

Each weekday contains one or more exercises. Each exercise contains the prescribed workout parameters for that exercise, including sets, repetitions, weight/resistance and other relevant instructions.

For example:

**Monday**

> Legs

→ Leg Curl

* Set 1: 5 kg × 10 reps
* Set 2: 7.5 kg × 10 reps
* Set 3: 10 kg × 10 reps

→ Leg Press

* Set 1: 40 kg × 12 reps
* Set 2: 50 kg × 10 reps
* Set 3: 60 kg × 8 reps

The member should be able to open the Training Card in the mobile app and see exactly what the trainer has prescribed for that day.

Each exercise should also support a **reference illustration/image showing the correct exercise technique**.

Videos are intentionally excluded from the initial implementation to avoid unnecessary storage and bandwidth costs. Video support should be designed as a future extension.

---

# 2. Goals

The Training Card feature should:

1. Allow trainers to create structured workout plans.
2. Organize workouts by weekday.
3. Allow multiple exercises per day.
4. Allow exercises to be grouped by muscle/body area.
5. Allow detailed set-by-set prescriptions.
6. Provide visual exercise technique guidance.
7. Allow trainers to assign a training card to a specific member.
8. Allow members to view their current workout plan from the mobile app.
9. Preserve previous versions of training cards.
10. Allow trainers to revise a training card without destroying its history.
11. Provide reminders when a training card is due for review.
12. Make the system flexible enough to support future workout tracking and videos.

---

# 3. Important Product Principle

The Training Card is a **prescription**, not merely an exercise list.

The system should distinguish between:

### What the trainer prescribed

Example:

> Leg Curl
> Set 1: 5 kg × 12
> Set 2: 7.5 kg × 10
> Set 3: 10 kg × 8

and, in a future version:

### What the member actually performed

Example:

> Leg Curl
> Set 1: 5 kg × 12 — completed
> Set 2: 7.5 kg × 10 — completed
> Set 3: 10 kg × 8 — completed

The MVP of this module only needs to implement the **prescribed workout**.

The data model should nevertheless be designed so that actual workout tracking can be added later without redesigning the Training Card.

---

# 4. Training Card Hierarchy

The logical structure should be:

```text
Member
   │
   └── Training Card
          │
          ├── Sunday
          │     ├── Exercise 1
          │     │      ├── Set 1
          │     │      ├── Set 2
          │     │      └── Set 3
          │     │
          │     └── Exercise 2
          │
          ├── Monday
          │     ├── Exercise 1
          │     └── Exercise 2
          │
          ├── Tuesday
          │
          ├── Wednesday
          │
          ├── Thursday
          │
          ├── Friday
          │
          └── Saturday
```

A Training Card therefore consists of:

**Training Card → Day → Exercise → Sets**

This hierarchy should be reflected in both the database and user interface.

---

# 5. Training Card

A Training Card represents one version of a workout program assigned to a member.

## Training Card Fields

* Training Card ID
* Member ID
* Training Card Name
* Description / Trainer Notes
* Created By
* Created Date
* Effective From
* Review Date
* Status
* Version Number
* Previous Version ID
* Last Updated By
* Last Updated Date

### Suggested Status Values

* Draft
* Active
* Superseded
* Archived

Only one Training Card version should normally be **Active** for a member at a time.

---

# 6. Training Card Name

The trainer should be able to give the program a meaningful name.

Examples:

* Beginner Fitness — Phase 1
* Weight Loss — Month 1
* Strength Program — Phase 2
* General Fitness — Starter Program
* Muscle Building — Block 1

The name should not be mandatory if the product wants to keep the workflow lightweight, but it is strongly recommended.

---

# 7. Weekly Structure

Every Training Card contains seven day buckets:

| Day       | Purpose        |
| --------- | -------------- |
| Sunday    | Workout / Rest |
| Monday    | Workout / Rest |
| Tuesday   | Workout / Rest |
| Wednesday | Workout / Rest |
| Thursday  | Workout / Rest |
| Friday    | Workout / Rest |
| Saturday  | Workout / Rest |

The trainer does not have to assign exercises to every day.

A day may be explicitly marked:

* Workout
* Rest Day
* Recovery / Mobility
* Not Assigned

This is preferable to simply leaving the day empty because the member can then clearly understand whether the absence of exercises means "rest" or "trainer has not assigned anything."

---

# 8. Exercise Grouping

Within each day, exercises should optionally be grouped into logical sections.

Examples:

### Monday — Legs

**Warm-up**

* Treadmill Walk

**Quadriceps**

* Leg Press
* Leg Extension

**Hamstrings**

* Leg Curl
* Romanian Deadlift

**Calves**

* Standing Calf Raise

**Cool-down**

* Hamstring Stretch

The grouping is primarily for readability and should not impose unnecessary complexity on the trainer.

Suggested group types:

* Warm-up
* Strength
* Cardio
* Mobility
* Stretching
* Cool-down
* Custom

A trainer should also be able to create a custom group name.

---

# 9. Exercise

An exercise should be selected from an **Exercise Library** rather than entered manually every time.

Example:

```text
Exercise Library
    └── Leg Curl
         ├── Primary Muscle: Hamstrings
         ├── Equipment: Leg Curl Machine
         ├── Exercise Type: Strength
         └── Reference Image
```

This provides consistency across all trainers and members.

## Exercise Fields

* Exercise ID
* Exercise Name
* Description
* Primary Muscle Group
* Secondary Muscle Group(s)
* Equipment
* Exercise Type
* Difficulty Level
* Reference Image URL
* Image Alt Text
* Trainer Instructions
* Safety / Technique Notes
* Active / Inactive status

---

# 10. Recommended Exercise Categories

The Exercise Library should initially support broad categories such as:

### Chest

* Bench Press
* Incline Bench Press
* Chest Press
* Cable Fly
* Pec Deck

### Back

* Lat Pulldown
* Seated Row
* One-arm Dumbbell Row
* Assisted Pull-up

### Shoulders

* Shoulder Press
* Lateral Raise
* Front Raise
* Rear Delt Fly

### Arms

* Biceps Curl
* Hammer Curl
* Triceps Pushdown
* Overhead Triceps Extension

### Legs

* Squat
* Leg Press
* Leg Extension
* Leg Curl
* Calf Raise
* Romanian Deadlift

### Core

* Plank
* Crunch
* Leg Raise
* Cable Crunch

### Cardio

* Treadmill
* Cycling
* Cross Trainer
* Rowing

### Mobility / Stretching

* Hamstring Stretch
* Quad Stretch
* Hip Flexor Stretch
* Shoulder Mobility

The initial library should remain manageable. It can be expanded over time.

---

# 11. Set Prescription

Each exercise can have one or more sets.

Each set should be independently configurable.

Example:

```text
Leg Curl

Set 1
Weight: 5 kg
Reps: 10

Set 2
Weight: 7.5 kg
Reps: 10

Set 3
Weight: 10 kg
Reps: 10
```

This is preferable to simply storing:

> 3 sets × 10 reps @ 10 kg

because trainers frequently prescribe progressive loading across sets.

---

# 12. Set Fields

Each prescribed set should support:

### Required / Core

* Set Number
* Repetitions

### Optional

* Weight
* Weight Unit
* Duration
* Distance
* Resistance Level
* Rest Duration
* Tempo
* RPE / Effort Target
* Trainer Notes

The UI should dynamically adapt depending upon exercise type.

For example:

### Weight-based exercise

```text
Set 1    5 kg      10 reps
Set 2    7.5 kg    10 reps
Set 3    10 kg     8 reps
```

### Bodyweight exercise

```text
Set 1    Bodyweight    12 reps
Set 2    Bodyweight    10 reps
Set 3    Bodyweight     8 reps
```

### Time-based exercise

```text
Set 1    30 seconds
Set 2    30 seconds
Set 3    45 seconds
```

### Cardio

```text
Treadmill
Duration: 20 min
Target pace: 5.5 km/h
```

The system should therefore avoid assuming that every exercise is simply:

`Weight × Repetitions × Sets`.

---

# 13. Weight Units

The application should support at least:

* kg
* lb

The member should normally see the unit selected by the trainer.

The system should not silently convert weights unless a deliberate unit-conversion feature is added.

---

# 14. Repetition Types

The repetition field should support:

* Exact number
* Range

Examples:

```text
10 reps
```

or

```text
8–12 reps
```

The database should therefore not necessarily assume that repetitions are always an integer.

A practical implementation can initially use:

```text
rep_min
rep_max
```

with `rep_max` optional.

---

# 15. Rest Period

Rest between sets is an important part of a structured workout prescription.

The trainer should optionally specify:

```text
Rest: 60 seconds
```

The rest period may be:

* Per exercise
* Per set

For MVP, **per exercise** is sufficient.

Future versions may support different rest durations between individual sets.

---

# 16. Tempo

Tempo may be useful for strength-training programs.

Example:

```text
Tempo: 3-1-2
```

However, this should be an optional advanced field.

The initial UI should not overwhelm trainers with advanced fields.

Recommended MVP:

* Reps
* Weight
* Rest
* Notes

Advanced fields can be progressively exposed.

---

# 17. Exercise Reference Image

Every exercise should support an instructional reference image.

The purpose is to provide the member with a quick visual reminder of the correct movement.

Example:

```text
LEG CURL

[ Exercise Illustration ]

Sets:
1. 5 kg × 10
2. 7.5 kg × 10
3. 10 kg × 10

Rest: 60 sec

Trainer Note:
Keep hips firmly against the pad and control the movement.
```

---

# 18. Image Storage Strategy

The application should **not store a separate image file for every Training Card**.

Instead, images should belong to the centralized Exercise Library.

Example:

```text
Exercise
   ↓
Leg Curl
   ↓
Reference Image URL
```

Every member using "Leg Curl" therefore references the same image.

Advantages:

* Very low storage usage
* No duplication
* Faster delivery
* Easy replacement of an outdated illustration
* Consistent exercise presentation
* Training Cards remain lightweight

The Training Card should store an `exercise_id`, not a copied image.

---

# 19. Image Hosting

For the initial implementation, the exercise image should preferably be hosted through a CDN or object-storage service rather than embedded directly in the database.

Recommended architecture:

```text
PostgreSQL
    │
    └── Exercise
          └── image_url
                  │
                  ▼
             CDN / Object Storage
                  │
                  ▼
              Mobile App
```

The actual implementation can use the application's selected cloud storage/CDN architecture.

The database should only store metadata such as:

* URL
* Thumbnail URL
* Alt text
* Source
* Attribution
* Version

---

# 20. Image Licensing

Exercise illustrations should only be used if the gym has the right to use them.

The Exercise Library should therefore support:

* Image source
* License information
* Attribution requirements
* Source URL

Do not allow trainers to randomly copy images from Google Images and upload them into the system.

A centrally managed exercise library is preferable.

---

# 21. Video — Future Feature

Video should NOT be part of the first implementation.

The architecture should nevertheless allow it later.

Future Exercise structure:

```text
Exercise
 ├── Reference Image
 ├── Thumbnail
 └── Instructional Video
```

The video should eventually be hosted externally or through object storage/CDN rather than bundled inside the mobile application.

Possible future options:

* Cloud object storage + CDN
* Streaming video platform
* Embedded external instructional video

The mobile application should never ship with hundreds of exercise videos bundled into the APK.

---

# 22. Trainer Workflow

The trainer workflow should be extremely simple.

### Step 1 — Open Member

Trainer opens:

```text
Members
    ↓
Member Profile
    ↓
Training Card
```

### Step 2 — Create Training Card

Trainer selects:

```text
Create Training Card
```

Enters:

* Training Card Name
* Effective Date
* Review Date
* General Instructions

### Step 3 — Select Day

Example:

```text
Sunday
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
```

### Step 4 — Add Exercise

Trainer selects:

```text
+ Add Exercise
```

Searches:

```text
Leg Curl
```

Selects the exercise.

### Step 5 — Configure Exercise

Trainer enters:

```text
Sets: 3

Set 1    5 kg     10 reps
Set 2    7.5 kg   10 reps
Set 3    10 kg    10 reps

Rest: 60 sec
```

### Step 6 — Add Another Exercise

Trainer can continue adding exercises.

### Step 7 — Reorder

Trainer can drag exercises into the desired sequence.

### Step 8 — Save

Training Card is saved as:

```text
Draft
```

### Step 9 — Publish

Trainer reviews the entire week and selects:

```text
Publish Training Card
```

The member can now see the training program.

---

# 23. Publishing Model

A Training Card should have two distinct states:

### Draft

Only trainers/managers can see it.

### Published / Active

The member can see it.

This prevents members from seeing incomplete workout programs while the trainer is still creating them.

Once published, editing should create a new revision rather than silently changing historical information.

---

# 24. Revision History

Revision history is an explicit requirement of the original specification. 

Example:

```text
Training Card
Version 1
Created: 1 Aug
Status: Superseded

Version 2
Created: 15 Aug
Status: Active
```

The system should retain previous versions.

A trainer should be able to view:

* Version number
* Created date
* Created by
* Review date
* Changes made
* Status

---

# 25. What Happens When a Trainer Changes a Workout?

Example:

Version 1:

```text
Leg Curl
5 kg × 10
7.5 kg × 10
10 kg × 10
```

Trainer later changes it to:

```text
Leg Curl
7.5 kg × 10
10 kg × 10
12.5 kg × 8
```

Do NOT overwrite Version 1.

Create:

```text
Version 2
```

Version 1 remains available for historical reference.

---

# 26. Review Date

Every active Training Card should have a review date.

Example:

```text
Created: 1 August
Effective From: 1 August
Review Date: 29 August
```

The system should generate a reminder to the trainer before the review date.

Suggested reminders:

* 7 days before
* 3 days before
* 1 day before
* On review date

These timings should eventually be configurable.

---

# 27. Training Card Review Workflow

When the review date approaches:

```text
Trainer
   ↓
Notification
   ↓
Open Training Card
   ↓
Review Member Progress
   ↓
Modify / Continue / Replace
```

Possible actions:

* Continue current program
* Modify exercises
* Modify weights/reps
* Create new version
* End program

---

# 28. Member Mobile App — Training Card

The member's mobile application should present the training plan in a highly visual and simple manner.

Suggested screen:

```text
My Training

Week of 18 Aug

[ Sun ] [ Mon ] [ Tue ] [ Wed ] [ Thu ] [ Fri ] [ Sat ]

Monday

LEG DAY

Warm-up
--------------------------------
Treadmill
10 min

Legs
--------------------------------
Leg Press

Set 1   40 kg × 12
Set 2   50 kg × 10
Set 3   60 kg × 8

[Exercise Image]

Leg Curl

Set 1   5 kg × 10
Set 2   7.5 kg × 10
Set 3   10 kg × 10

[Exercise Image]

Rest: 60 sec
```

The member should be able to switch between weekdays with a single tap.

---

# 29. Today's Workout

The mobile app should make today's workout immediately accessible.

Home screen:

```text
Today's Workout

Monday — Legs

5 Exercises
Approx. 55 min

[ Start Workout ]
```

For the initial implementation, "Start Workout" can simply open the day's Training Card.

A full workout execution/tracking mode should be considered a future enhancement.

---

# 30. Rest Days

Rest days should be explicitly visible.

Example:

```text
Wednesday

REST DAY

No workout assigned today.

Follow the recovery instructions provided by your trainer.
```

This is better than showing an empty screen.

---

# 31. Trainer Notes

Both the Training Card and individual exercises should support trainer notes.

Examples:

### Training Card note

> Focus on controlled movement throughout the program.

### Exercise note

> Do not lock the knees at the top of the movement.

Notes should be displayed prominently enough for the member to notice them.

---

# 32. Safety / Medical Considerations

The application should not automatically prescribe exercises based solely on a member's profile.

The system may store:

* Medical History
* Allergies
* Fitness Goals
* Fitness Measurements

but these should be treated as **information available to the trainer**, not as an automated exercise prescription engine.

The trainer remains responsible for selecting an appropriate workout plan.

In particular, the application should not automatically recommend exercises for members with medical conditions or injuries unless a future professionally validated rules engine is introduced.

The UI should therefore avoid language such as:

> "Recommended by the app"

for trainer-created exercises.

Instead:

> "Assigned by your trainer"

---

# 33. Exercise Library Management

Owner/Manager should be able to manage the centralized exercise library.

Capabilities:

* Add exercise
* Edit exercise
* Deactivate exercise
* Search exercise
* Categorize exercise
* Add reference image
* Add instructions
* Add safety notes

Trainer permissions:

* Search exercises
* Use exercises in Training Cards
* Optionally suggest a new exercise to the Manager

For MVP, trainers should preferably not be able to modify the global Exercise Library directly.

This avoids inconsistent exercise names and images.

---

# 34. Exercise Search

The trainer should be able to search using:

* Exercise name
* Muscle group
* Equipment
* Exercise type

Example:

```text
Search: curl
```

Results:

```text
Biceps Curl
Cable Curl
Leg Curl
Preacher Curl
Hamstring Curl
```

---

# 35. Drag-and-Drop Ordering

Exercise order is important.

The trainer should be able to reorder exercises using drag-and-drop.

Example:

```text
1. Warm-up
2. Squat
3. Leg Press
4. Leg Extension
5. Leg Curl
6. Calf Raise
7. Stretching
```

The order should be persisted.

---

# 36. Superset / Circuit Support

This should be considered a **future enhancement**, not mandatory for the first release.

Future examples:

```text
Superset A

A1. Dumbbell Bench Press
A2. Cable Fly
```

or:

```text
Circuit

Exercise 1 → 30 sec
Exercise 2 → 30 sec
Exercise 3 → 30 sec
Rest → 60 sec
```

The underlying data model should not make this impossible later.

---

# 37. Database Model — Conceptual

The following entities are recommended.

```text
members
    │
    └── training_cards
             │
             └── training_card_days
                       │
                       └── training_card_exercises
                                  │
                                  └── training_card_sets


exercise_library
```

Suggested tables:

### `training_cards`

* id
* member_id
* name
* description
* version
* status
* effective_from
* review_date
* created_by
* created_at
* updated_by
* updated_at
* previous_version_id

### `training_card_days`

* id
* training_card_id
* weekday
* day_type
* notes
* display_order

`weekday`:

```text
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

### `training_card_exercises`

* id
* training_card_day_id
* exercise_id
* section_name
* display_order
* notes
* rest_seconds

### `training_card_sets`

* id
* training_card_exercise_id
* set_number
* rep_min
* rep_max
* weight
* weight_unit
* duration_seconds
* distance
* resistance_level
* tempo
* rpe
* notes

### `exercises`

* id
* name
* description
* primary_muscle_group
* secondary_muscle_groups
* equipment
* exercise_type
* difficulty
* image_url
* thumbnail_url
* image_source
* image_license
* image_attribution
* technique_notes
* safety_notes
* active
* created_at
* updated_at

---

# 38. Important Data-Modelling Principle

Do not store the complete workout as one JSON blob inside `training_cards`.

For example, avoid:

```text
training_cards
    workout_json = "{ ... entire workout ... }"
```

The workout should be normalized into related entities.

Reasons:

* Easier querying
* Better revision handling
* Easier reporting
* Easier future workout tracking
* Easier exercise-library reuse
* Easier analytics
* Better API design

JSON can still be used for API responses where appropriate.

---

# 39. API Requirements

Suggested endpoints:

### Training Cards

```http
GET    /members/{memberId}/training-cards
POST   /members/{memberId}/training-cards
GET    /training-cards/{id}
PUT    /training-cards/{id}
POST   /training-cards/{id}/publish
POST   /training-cards/{id}/archive
GET    /training-cards/{id}/versions
```

### Days

```http
GET    /training-cards/{id}/days
PUT    /training-cards/{id}/days/{weekday}
```

### Exercises

```http
POST   /training-card-days/{dayId}/exercises
PUT    /training-card-exercises/{id}
DELETE /training-card-exercises/{id}
```

### Exercise Library

```http
GET    /exercises
POST   /exercises
GET    /exercises/{id}
PUT    /exercises/{id}
```

The exact API structure should follow the project's overall API conventions.

---

# 40. Permissions

### Owner

Full access.

* View all Training Cards
* Create
* Edit
* Publish
* Archive
* Manage Exercise Library
* View history

### Manager

Operational access.

* View Training Cards
* Create
* Edit
* Publish
* Review
* Manage Exercise Library if authorized

### Trainer

Member-assigned access.

* View assigned members
* Create Training Cards
* Edit own drafts
* Publish assigned member plans
* Review previous plans
* Use Exercise Library

### Member

Read-only access.

* View active Training Card
* View exercise instructions
* View exercise images
* View trainer notes

Members cannot modify prescriptions.

---

# 41. MVP Scope for Training Cards

The first release of this module should include:

* Create Training Card
* Assign to member
* Sunday–Saturday structure
* Rest days
* Exercise Library
* Exercise search
* Add multiple exercises per day
* Exercise ordering
* Exercise grouping
* Set-by-set prescription
* Weight
* Repetitions
* Rep ranges
* Rest period
* Trainer notes
* Exercise reference image
* Draft state
* Publish state
* Active Training Card
* Review date
* Review reminders
* Version history
* Member mobile-app viewing

This is the recommended **V2 Training Card MVP**.

---

# 42. Defer to Future Releases

The following should not delay the initial Training Card implementation:

### Workout Execution Tracking

Member records:

* Completed
* Skipped
* Actual weight
* Actual reps
* Difficulty

### Workout Timer

* Rest timer
* Exercise timer
* Workout duration

### Progress Analytics

* Weight progression
* Rep progression
* Exercise frequency
* Training consistency

### Videos

* Exercise videos
* Trainer videos
* Video streaming

### Supersets

* A/B exercises
* Circuits

### Advanced Programming

* Progressive overload automation
* Periodization
* Training blocks
* Deload weeks

### AI

* AI workout generation
* AI exercise recommendations
* AI progression recommendations

These features can be added after the core Training Card workflow is proven.

---

# 43. Recommended Future Workout Tracking Model

Although not part of the initial implementation, the architecture should anticipate:

```text
Training Card
      ↓
Prescribed Workout
      ↓
Workout Session
      ↓
Exercise Performance
      ↓
Set Performance
```

Example:

```text
Prescription

Leg Curl
Set 1: 5 kg × 10
Set 2: 7.5 kg × 10
Set 3: 10 kg × 10


Actual Performance

Leg Curl
Set 1: 5 kg × 10 ✓
Set 2: 7.5 kg × 10 ✓
Set 3: 10 kg × 8
```

This distinction will eventually enable meaningful progress tracking.

---

# 44. UX Principles

The Trainer UI should optimize for **speed of creation**.

A trainer should not need to fill 15 fields to add a simple exercise.

The most common workflow should be:

```text
Select Day
    ↓
Add Exercise
    ↓
Select Exercise
    ↓
Enter Sets/Reps/Weight
    ↓
Save
```

Advanced parameters should be hidden behind:

```text
More Options
```

rather than shown by default.

---

# 45. Member UX Principles

The member experience should be significantly simpler than the trainer experience.

The member should primarily see:

1. Today's workout
2. Exercise name
3. Exercise image
4. Sets
5. Reps
6. Weight
7. Rest
8. Trainer instructions

Avoid exposing database-like terminology such as:

* Training Card ID
* Version ID
* Exercise ID
* Revision ID

These are system concepts, not member-facing concepts.

---

# 46. Example Complete Training Card

## Member

**Rahul**

## Program

**General Fitness — Month 1**

## Effective From

**18 August 2026**

## Review Date

**15 September 2026**

---

### Sunday

**REST DAY**

---

### Monday — Legs

#### Warm-up

**Treadmill**

Duration: 10 minutes

---

#### Quadriceps

**Leg Press**

| Set | Weight | Reps |
| --- | -----: | ---: |
| 1   |  40 kg |   12 |
| 2   |  50 kg |   10 |
| 3   |  60 kg |    8 |

Rest: 90 seconds

---

**Leg Extension**

| Set | Weight | Reps |
| --- | -----: | ---: |
| 1   |  15 kg |   12 |
| 2   |  20 kg |   10 |
| 3   |  25 kg |    8 |

Rest: 60 seconds

---

#### Hamstrings

**Leg Curl**

[Reference Exercise Illustration]

| Set | Weight | Reps |
| --- | -----: | ---: |
| 1   |   5 kg |   10 |
| 2   | 7.5 kg |   10 |
| 3   |  10 kg |   10 |

Rest: 60 seconds

**Trainer Note:**

> Keep the movement controlled and avoid lifting the hips from the pad.

---

### Tuesday

**REST DAY**

---

### Wednesday — Chest & Triceps

...

---

# 47. Acceptance Criteria

The Training Card module is considered complete when:

* A trainer can create a Training Card for a member.
* The card contains Sunday through Saturday.
* A day can be marked as a rest day.
* A trainer can add multiple exercises to a day.
* Exercises can be reordered.
* Exercises can be grouped.
* Each exercise can contain multiple sets.
* Each set can have different weight and repetitions.
* Rep ranges are supported.
* Bodyweight exercises are supported.
* Time-based exercises can be represented.
* Rest periods can be specified.
* Trainer notes can be added.
* Each exercise can display a reference image.
* Exercise images are reused from the central Exercise Library.
* Images are not duplicated for each member/card.
* A card can be saved as Draft.
* A card can be Published.
* A member sees only the active published card.
* A new revision can be created without destroying the previous version.
* Review dates can be assigned.
* Review reminders can be generated.
* Trainer permissions are enforced.
* Member permissions are read-only.
* The mobile UI is usable on a normal smartphone.
* No exercise video storage is required.
* The underlying architecture can support videos and workout-performance tracking later.

---

# 48. Development Priority

Implement this feature in the following sequence:

### P1 — Exercise Library

1. Exercise database
2. Exercise categories
3. Exercise search
4. Exercise image
5. Exercise instructions

### P2 — Training Card Data Model

1. Training Card
2. Day
3. Exercise
4. Set
5. Revision

### P3 — Trainer UI

1. Create card
2. Select day
3. Add exercise
4. Configure sets
5. Reorder exercises
6. Save draft
7. Publish

### P4 — Member UI

1. Training Card screen
2. Weekday selector
3. Today's workout
4. Exercise details
5. Exercise image
6. Trainer notes
7. Rest-day display

### P5 — Lifecycle

1. Review date
2. Reminder
3. Revision
4. Archive
5. Historical view

### P6 — Future Enhancements

1. Workout execution
2. Actual set recording
3. Progress tracking
4. Timers
5. Videos
6. Supersets
7. Advanced programming
8. AI-assisted recommendations

---

# 49. Final Product Direction

The Training Card should eventually become the central bridge between the trainer and the member.

The conceptual flow should be:

```text
Trainer
   │
   │ Creates
   ▼
Training Card
   │
   ├── Sunday
   ├── Monday
   ├── Tuesday
   ├── Wednesday
   ├── Thursday
   ├── Friday
   └── Saturday
          │
          └── Exercises
                 │
                 └── Sets / Reps / Weight / Instructions
                              │
                              ▼
                         Member App
                              │
                              ▼
                       Today's Workout
```

The initial implementation should focus on getting this workflow **simple, reliable and visually clear** rather than attempting to build a complete fitness-training platform.

The architecture should preserve enough flexibility to subsequently add workout execution, performance tracking, exercise videos, progression analytics, advanced programming and AI-assisted features without redesigning the core Training Card data model.
