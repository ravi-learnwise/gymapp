# Phase 0 — Bootstrap

Manual UAT checklist for project scaffold.

## Environment

- [ ] `activate-dev.ps1` runs (or `.cmd` wrapper works)
- [ ] MySQL starts via `start-mysql.ps1`
- [ ] `pnpm install` completes without errors

## Backend

- [ ] `pnpm backend:dev` starts NestJS on port 3000
- [ ] `GET http://localhost:3000/api` returns app info JSON
- [ ] `GET http://localhost:3000/api/health` returns `status: ok`, `database: connected`
- [ ] Swagger UI loads at http://localhost:3000/api/docs

## Frontend

- [ ] `pnpm frontend:dev` starts Vite on port 5173
- [ ] Login page loads at http://localhost:5173/login
- [ ] Login page footer shows API health status (connected)

## Build

- [ ] `pnpm build` completes with no TypeScript errors
- [ ] `backend/dist/main.js` exists
- [ ] `frontend/dist/index.html` exists

## Notes

_Date tested:_ ___________
_Tester:_ ___________
_Issues:_ ___________
