#!/bin/sh
set -e

cd /app/backend

echo "Running database migrations..."
../node_modules/.bin/prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Seeding database (SEED_ON_START=true)..."
  ../node_modules/.bin/prisma db seed
fi

echo "Starting API..."
exec node dist/main.js
