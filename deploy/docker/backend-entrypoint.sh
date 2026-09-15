#!/bin/sh
set -e

cd /app/backend

echo "Running database migrations..."
../node_modules/.bin/prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding database (SEED_ON_START=true)..."
  node dist/prisma/seed.js
fi

echo "Starting API..."
exec node dist/main.js
