#!/bin/sh
set -e

echo "Running database migrations..."
node /app/scripts/run-migrations.mjs

echo "Starting application..."
exec node /app/.output/server/index.mjs
