# GymApp

Gym Management System MVP — hosted CRM-style web app for gym owners, managers, and trainers.

## Documentation

| Document | Purpose |
|----------|---------|
| [specifications-mvp-v1.md](./specifications-mvp-v1.md) | MVP feature requirements |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Stack, phases, RBAC, dev commands — **start here for context** |
| [docs/uat-checklists/](./docs/uat-checklists/) | Manual UAT per phase |

## Quick start

```powershell
# Activate portable dev environment (G: drive)
# If PowerShell blocks scripts:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# Or double-click: G:\vibe-coding\devkit\scripts\activate-dev.cmd

. G:\vibe-coding\devkit\scripts\activate-dev.ps1
. G:\vibe-coding\devkit\scripts\start-mysql.ps1

cd G:\vibe-coding\projects\gymapp
copy .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Health | http://localhost:3000/api/health |

## Stack

React + Tailwind · NestJS · Prisma · MySQL 8 · pnpm monorepo

Portable tools: `G:\vibe-coding\devkit\` — see [G:\vibe-coding\README.md](../README.md)

## Git remote

```
origin  https://github.com/ravi-learnwise/gymapp.git
```

## Status

**Phase 4 complete** — Payment commitments, receipts, reminders, config edit for Programs/Discounts/Offers.

**Phase 5 next:** Fitness Assessment.

### Login (after `pnpm prisma:seed`)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@gym.com | Owner@123 |
| Manager | manager@gym.com | Manager@123 |
| Trainer | trainer@gym.com | Trainer@123 |
