# MVP Scope and High-Priority Features

## MVP Objective

The objective of Version 1 is to provide a stable, production-ready Gym Management System that digitizes the complete member lifecycle from enquiry through enrollment and payment while giving the gym owner complete operational visibility.

The MVP should deliberately avoid feature creep. Every module included in Version 1 must directly contribute to one or more of the following business objectives:

- Capture every enquiry
- Convert enquiries into enrollments
- Record all payments
- Maintain member records
- Track attendance (optional)
- Provide real-time business insights through dashboards

The software should be modular so that Version 2 functionality can be added without redesigning the existing architecture.

---

# MVP Modules

Modules shall be implemented in the following order.

## Phase 1 — Foundation

### Authentication

Priority: Critical

Features

- Secure login
- JWT authentication
- Password hashing
- Role-based authorization
- User session management
- Password reset
- User profile

Roles

- Owner
- Manager
- Trainer

Deliverables

- Authentication APIs
- Login UI
- User management
- Role middleware

---

### System Configuration

Priority: Critical

Configuration Items

- Gym information
- Membership programs
- Program durations
- Pricing
- Discount categories
- Offer categories
- User roles

Purpose

Every business module depends upon these master records.

---

## Phase 2 — Enquiry Management

Priority: Highest

This is the first operational module.

The enquiry system acts as the CRM for the gym.

Required fields include

- Full Name
- Age
- Gender
- Profession
- Family Details
- Mobile Number
- Alternate Contact Number
- Email
- Address
- Date of Enquiry
- Preferred Contact Time

Lead Sources

- Walk-in
- Referral
- Social Media
- Advertisement
- Corporate
- Online Search
- Other

Offer Information

- Offered Program
- Offered Discount
- Offer Category
- Offer Valid Till

Status Workflow

New

↓

Contacted

↓

Follow-up

↓

Trial

↓

Converted

or

Lost

Business Rules

- Every enquiry must have a unique identifier.
- Complete follow-up history must be maintained.
- Staff must never lose previous conversation notes.
- Conversion statistics should be generated automatically.
- Reminder scheduling should be supported.

Deliverables

- CRUD APIs
- Search
- Filters
- Notes
- Timeline
- Status history

---

## Phase 3 — Enrollment

Priority: Highest

Enrollment begins from an enquiry.

Important Rule

When an enquiry is converted into an enrollment:

ALL enquiry information must automatically populate the enrollment form.

Staff should never retype data already captured.

Additional Enrollment Data

- Date of Birth
- Height
- Weight
- BMI
- Medical History
- Allergies
- Diet Type
- Sports Participation
- Fitness Goals

Program Details

- Program
- Duration
- Trainer
- Trial
- Start Date
- End Date

Deliverables

- Enrollment wizard
- Auto-populated forms
- Member creation
- Membership creation

---

## Phase 4 — Payment Management

Priority: Highest

The software should assume that most members pay in full.

Instead of installment management, Version 1 should implement a Payment Commitment workflow.

Payment Fields

- Total Fee
- Discount
- Final Amount
- Amount Paid
- Pending Amount
- Commitment Date
- Commitment Notes
- Payment Status
- Payment Mode
- Receipt Number
- GST

Payment Status

- Paid
- Partial
- Pending

Automation

- Due reminders
- Receipt generation
- Dashboard alerts

Deliverables

- Payment APIs
- Receipts
- Payment history
- Outstanding payments

---

## Phase 5 — Fitness Assessment

Priority: High

Fitness assessment is captured during enrollment.

Fields

- Height
- Weight
- BMI
- Body Fat
- Waist
- Chest
- Hip
- Arm
- Thigh
- Medical History
- Fitness Goal

The system should preserve historical assessments.

---

## Phase 6 — Attendance (Optional Module)

Priority: Medium

Attendance should be configurable.

Some gyms may disable this module.

Fields

- Member
- Check-in
- Check-out
- Session Duration
- Batch

Analytics

- Daily attendance
- Monthly attendance
- Peak hours
- Low traffic
- Inactive members

---

## Phase 7 — Dashboard

Priority: Highest

This is the owner's landing page.

Dashboard Metrics

- Active Members
- New Enquiries
- Conversion Rate
- Revenue
- Revenue by Program
- Pending Payments
- Attendance Trends
- Peak Hours
- Program Enrollments
- Renewal Rate

Reports

- Daily
- Weekly
- Monthly
- Yearly

Financial

Enquiries

Enrollments

Payments

Attendance

Referrals

---

# Mobile App MVP

The mobile application should initially support only member self-service.

Features

- Login
- Membership Details
- Payment History
- Payment Receipts
- Pending Payment Reminder
- Membership Expiry
- Notifications
- Feedback

No trainer workflows are required in Version 1.

---

# Features Explicitly Deferred to Version 2

The following modules should NOT be implemented in the MVP.

- Training Cards
- Workout Planning
- Personal Training Management
- Paid Services
- Diet Counseling
- Facility Utilization
- AI Features
- Wearable Integration
- Multi-branch Support
- Inventory
- Churn Prediction

The architecture should support these additions without requiring major refactoring.

---

# Cursor Development Rules

Cursor must implement modules strictly in sequence.

Each phase must satisfy the following Definition of Done before proceeding.

- Database migrations complete
- Backend APIs complete
- Validation complete
- Authentication enforced
- Unit tests passing
- Frontend complete
- API documentation updated
- No TypeScript errors
- Production build succeeds

No future module should be scaffolded before the current phase is complete.

The application must remain deployable and runnable after every completed phase.
