# Phase 2 — Enquiry Management (CRM)

## List & Search

- [ ] Enquiries appear in sidebar for Owner and Manager (not Trainer)
- [ ] `/enquiries` shows list with stats cards (Total, Open, Converted, Conversion %)
- [ ] Search by name, mobile, email, or enquiry ID works
- [ ] Filter by status works
- [ ] Filter by lead source works

## Create Enquiry

- [ ] "+ New Enquiry" opens form with all required fields
- [ ] Creating enquiry assigns unique ID (ENQ-YYYY-NNNN format)
- [ ] Initial note appears in timeline
- [ ] Status starts as "New"

## Enquiry Detail

- [ ] Contact details and offer details display correctly
- [ ] Timeline shows status history and notes (newest first)
- [ ] Add note works and persists
- [ ] Status transitions follow workflow (e.g. New → Contacted → Follow-up)
- [ ] Invalid transitions rejected (e.g. New → Converted directly)
- [ ] Converted/Lost enquiries cannot be edited
- [ ] Schedule reminder works; mark as Done works

## Status Workflow

- [ ] New → Contacted or Lost
- [ ] Contacted → Follow-up, Trial, or Lost
- [ ] Trial → Converted, Follow-up, or Lost
- [ ] Converted and Lost are terminal (no further status changes)

## Dashboard

- [ ] Owner/Manager dashboard shows enquiry stats
- [ ] "View all" link goes to enquiries list
- [ ] Trainer does not see enquiry nav or stats

## API (Swagger)

- [ ] `GET /api/enquiries` with filters
- [ ] `GET /api/enquiries/stats`
- [ ] `POST /api/enquiries`
- [ ] `PATCH /api/enquiries/:id/status`
- [ ] Trainer gets 403 on enquiry endpoints

_Date tested:_ ___________
