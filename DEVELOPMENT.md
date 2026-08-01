# GymApp — Development Guide

This document captures the **agreed MVP plan (v2)** so future Cursor sessions retain context. For feature requirements see [specifications-mvp-v1.md](./specifications-mvp-v1.md).

## Product summary

Hosted **CRM-style gym management** web app for **Owner**, **Manager**, and **Trainer** roles. Member mobile app is **post-MVP**.

**Business flow:** Enquiry → Enrollment → Payment → (optional) Attendance → Dashboard insights.

## Tech stack (v2 — confirmed)

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite + React Router |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Forms (Phase 1+) | React Hook Form + Zod |
| UI components (Phase 1+) | shadcn/ui |
| Backend | Node.js + NestJS (TypeScript) |
| ORM | Prisma + MySQL 8 |
| Auth (Phase 1) | JWT (access + refresh), bcrypt |
| Web server (UAT/prod) | Nginx → static React + `/api` proxy |
| Process manager | PM2 |
| Testing | Manual UAT checklists per phase (automated tests on `test-automation` branch) |
| Cloud target | AWS EC2 + MySQL (RDS or on-instance) |

**Not used:** Tomcat (Java-only), PostgreSQL (MySQL preferred), automated test suite for MVP.

## Portable dev environment

All tools live on **G:\vibe-coding\devkit\** (external drive). See [G:\vibe-coding\README.md](../README.md).

```powershell
# If PowerShell blocks scripts:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Or use the .cmd wrapper:
G:\vibe-coding\devkit\scripts\activate-dev.cmd

# Then:
. G:\vibe-coding\devkit\scripts\activate-dev.ps1
. G:\vibe-coding\devkit\scripts\start-mysql.ps1
cd G:\vibe-coding\projects\gymapp
```

**Database:** `mysql://gymapp:gymapp_dev@localhost:3306/gymapp`

## Repository structure

```
gymapp/
├── backend/           NestJS API + Prisma
├── frontend/          React SPA
├── deploy/
│   ├── nginx/         Local UAT config
│   └── pm2/           Production process config
├── docs/
│   └── uat-checklists/   Manual test checklists (per phase)
├── specifications-mvp-v1.md
└── DEVELOPMENT.md     ← this file
```

## Phase delivery order

Build **strictly in sequence**. Do not scaffold future modules early.

| Phase | Module | Priority |
|-------|--------|----------|
| **0** | Bootstrap (monorepo, health API, login shell) | Done when scaffold + build pass |
| **1** | Authentication + System Configuration | Critical |
| **2** | Enquiry Management (CRM) | Highest |
| **3** | Enrollment | Highest |
| **4** | Payment Management | Highest |
| **5** | Fitness Assessment | High |
| **6** | Attendance (configurable) | Medium |
| **7** | Dashboard & Reports | Highest |

**Deferred to v2:** Training cards, workout planning, PT management, multi-branch, AI, inventory, member mobile app (separate track).

## Definition of Done (per phase)

- Database migrations complete
- Backend APIs + validation complete
- Authentication / RBAC enforced on routes
- Frontend screens complete
- Swagger updated
- No TypeScript errors; `pnpm build` succeeds
- Manual UAT checklist passed
- Deployable via Nginx + PM2 after each phase

## RBAC matrix (proposed)

| Module | Owner | Manager | Trainer |
|--------|-------|---------|---------|
| Dashboard & reports | Full | Ops subset (no financial export) | None |
| User management | CRUD | None | None |
| System configuration | CRUD | Read-only | None |
| Enquiry CRM | Full | Full | None |
| Enrollment | Full | Full | Assigned members only |
| Payments & receipts | Full | Full | None |
| Fitness assessment | Full | Full | Assigned members |
| Attendance | Full | Full | Check-in for assigned |

## Local development

### First-time setup

```powershell
copy .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

> **exFAT drive (G:):** `.npmrc` sets `node-linker=hoisted` because exFAT does not support symlinks. Do not remove this.

> **Prisma migrations:** `SHADOW_DATABASE_URL` in `.env` uses local MySQL `root` (no password) for migrate shadow DB only.

### Dev mode (daily work — HMR)

```powershell
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |

### UAT mode (mirrors EC2)

```powershell
pnpm build
pm2 start deploy/pm2/ecosystem.config.js
# nginx -c deploy/nginx/gymapp.local.conf  → http://localhost:8080
```

## Git

Remote: `https://github.com/ravi-learnwise/gymapp.git`

Portable git config: `G:\vibe-coding\devkit\git\gitconfig` (set by activate-dev.ps1).

## Current status

- **Phase 0:** Complete — monorepo scaffold, health API
- **Phase 1:** Complete — Auth (JWT, RBAC), system config, admin UI
- **Phase 2:** Complete — Enquiry CRM (CRUD, workflow, notes, timeline, reminders, stats)
- **Phase 3:** Complete — Enrollment wizard, member & membership creation, trainer member view
- **Phase 4:** Complete — Payment commitments, receipts, reminders, config edit UI
- **Phase 5:** Next — Fitness Assessment

## Default login accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@gym.com | Owner@123 |
| Manager | manager@gym.com | Manager@123 |
| Trainer | trainer@gym.com | Trainer@123 |

Run seed: `pnpm prisma:seed`

## Cursor kickoff prompt (new chats)

> Continue GymApp MVP. Read DEVELOPMENT.md and specifications-mvp-v1.md. Implement the next incomplete phase only. Stack: React + Tailwind + NestJS + Prisma + MySQL on G:\vibe-coding\devkit. Manual UAT only.
