# GymApp — Deployment Guide

Docker-based deployment for **demo and early production** on AWS EC2.  
Database: **MySQL 8 in a container** (upgrade to RDS when you have paying subscribers).

## Architecture

```
Internet → EC2 (port 80/443)
              └── web (nginx) ── /     → React SPA (static)
                              └── /api → api (NestJS :3000)
                                         └── db (MySQL 8)
```

| Service | Role |
|---------|------|
| **web** | Nginx — serves `frontend/dist`, proxies `/api` to `api` |
| **api** | NestJS — runs `prisma migrate deploy` on start, then `node dist/main.js` |
| **db** | MySQL 8 — persistent volume `mysql_data` |

Frontend uses relative `/api` paths (`frontend/src/lib/api.ts`), so no `VITE_API_URL` is needed when Nginx and API share the same host.

## Prerequisites

- Docker Engine 24+ and Docker Compose v2 on the target host
- AWS EC2: Ubuntu 22.04+, **t3.small** (2 GB RAM) recommended for demo
- Security group: inbound **22** (SSH), **80** (HTTP), **443** (HTTPS when added)

## Local Docker test (before AWS)

```powershell
cd G:\vibe-coding\projects\gymapp
copy .env.production.example .env.production
# Edit .env.production — set passwords and JWT secrets

docker compose --env-file .env.production up -d --build
```

| URL | Purpose |
|-----|---------|
| http://localhost | Frontend (or `HTTP_PORT` from `.env.production`) |
| http://localhost/api/health | Health check — expect `"phase":4` |
| http://localhost/api/docs | Swagger (optional) |

**First deploy:** set `SEED_ON_START=true` in `.env.production` to create demo accounts, then set it back to `false` and run `docker compose --env-file .env.production up -d`.

**Stop:**

```powershell
docker compose --env-file .env.production down
```

**Wipe database:**

```powershell
docker compose --env-file .env.production down -v
```

## AWS EC2 setup

### 1. Launch instance

- AMI: Ubuntu 22.04 LTS
- Type: **t3.small** (demo)
- Storage: 20–30 GB gp3
- Security group: SSH (your IP), HTTP 80 (0.0.0.0/0 for demo)

### 2. Install Docker on EC2

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker ubuntu
# Log out and back in
```

### 3. Deploy

```bash
git clone https://github.com/ravi-learnwise/gymapp.git
cd gymapp
git checkout main

cp .env.production.example .env.production
nano .env.production   # passwords, JWT secrets, CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP

docker compose --env-file .env.production up -d --build
```

Open `http://YOUR_EC2_PUBLIC_IP` in a browser.

### 4. Demo login (after seed)

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@gym.com | Owner@123 |
| Manager | manager@gym.com | Manager@123 |
| Trainer | trainer@gym.com | Trainer@123 |

### 5. HTTPS (recommended before showing gym owners)

Use Certbot or Caddy in front of the stack. Update `CORS_ORIGIN` to `https://your-domain.com`.

## Environment variables

See [`.env.production.example`](../.env.production.example).

| Variable | Required | Notes |
|----------|----------|-------|
| `MYSQL_ROOT_PASSWORD` | Yes | MySQL root |
| `MYSQL_PASSWORD` | Yes | App user password |
| `JWT_ACCESS_SECRET` | Yes | 32+ random chars |
| `JWT_REFRESH_SECRET` | Yes | 32+ random chars |
| `CORS_ORIGIN` | Yes | Public site URL |
| `HTTP_PORT` | No | Default `80` |
| `SEED_ON_START` | No | `true` once for demo accounts |

## Operations

### View logs

```bash
docker compose --env-file .env.production logs -f api
```

### Restart after code update

```bash
git pull
docker compose --env-file .env.production up -d --build
```

### Manual backup

```bash
docker compose --env-file .env.production exec db \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" gymapp > backup.sql
```

## Upgrade path: MySQL container → RDS

When you have paying subscribers:

1. Create RDS MySQL 8 in the same VPC
2. Dump container DB → restore to RDS
3. Remove `db` service; set `DATABASE_URL` on `api` to RDS endpoint
4. Redeploy

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `api` exits on start | `docker compose logs api` — DB not ready or bad credentials |
| 502 / proxy errors | Wait for `api`; ensure `db` healthcheck passes |
| Login fails | Run once with `SEED_ON_START=true` |
| Out of memory | Use t3.small |

## Related docs

- [DEVELOPMENT.md](../DEVELOPMENT.md) — local dev
- [deploy/pm2/](../pm2/) — legacy non-Docker UAT
