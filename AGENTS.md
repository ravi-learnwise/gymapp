# GymApp — Agent Context

Read this file (and `DEVELOPMENT.md`) at the start of new Cursor sessions.

## Project

Hosted **CRM-style gym management** MVP for Owner, Manager, and Trainer roles.

| Item | Value |
|------|-------|
| Repo | https://github.com/ravi-learnwise/gymapp.git |
| Branch `main` | MVP app (Phases 0–4 complete) |
| Branch `test-automation` | MVP + Jest/Vitest/Playwright tests |

## Stack

React 19 + Vite + Tailwind v4 · NestJS · Prisma · MySQL 8 · pnpm monorepo

## Local development

- Portable devkit: `G:\vibe-coding\devkit\`
- Activate: `. G:\vibe-coding\devkit\scripts\activate-dev.ps1`
- MySQL: `. G:\vibe-coding\devkit\scripts\start-mysql.ps1`
- Project: `G:\vibe-coding\projects\gymapp`
- Daily: `pnpm dev` → http://localhost:5173

## Deployment (Docker on AWS EC2)

- **Target:** demo / early production on single EC2 instance
- **Database:** MySQL container (not RDS until subscriptions)
- **Docs:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Compose:** `docker compose --env-file .env.production up -d --build`
- **Do not commit** `.env`, `.env.production`, or secrets

## Phase status

| Phase | Module | Status |
|-------|--------|--------|
| 0–4 | Bootstrap through Payments | Done on `main` |
| 5 | Fitness Assessment | Next |
| 6 | Attendance | Pending |
| 7 | Dashboard & Reports | Pending |

Build **strictly in sequence** — one phase per session unless fixing bugs.

## Conventions

- Match existing code style; minimal diffs
- RBAC enforced on all API routes
- `pnpm build` must pass before merge
- Manual UAT checklist per phase in `docs/uat-checklists/`
- Automated tests live on `test-automation` branch only

## Default accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@gym.com | Owner@123 |
| Manager | manager@gym.com | Manager@123 |
| Trainer | trainer@gym.com | Trainer@123 |

## Kickoff prompt

> Continue GymApp MVP. Read AGENTS.md, DEVELOPMENT.md, and specifications-mvp-v1.md. Implement the next incomplete phase only. Local dev uses G:\vibe-coding\devkit. Deployment uses Docker — see docs/DEPLOYMENT.md.
