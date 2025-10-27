#!/bin/bash

# Setup test database for GoMafia import tests
set -e

echo "Setting up import test database..."

# Load environment variables
if [ -f .env.test ]; then
    export $(grep -v '^#' .env.test | xargs)
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL client (psql) not found. Please install PostgreSQL first."
    exit 1
fi

# Database connection parameters
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-postgres}"
DB_NAME="mafia_insight_import_test"

echo "Creating test database: ${DB_NAME}"

# Drop existing test database if exists (clean slate)
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 && \
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "DROP DATABASE ${DB_NAME};" || echo "Database does not exist yet"

# Create fresh test database
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"

# Set DATABASE_URL for Prisma
export DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
export DIRECT_URL="${DATABASE_URL}"

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "✓ Import test database setup complete!"
echo "  Database: ${DB_NAME}"
echo "  Connection: ${DATABASE_URL}"
echo ""
echo "To run import tests, use:"
echo "  DATABASE_URL=\"${DATABASE_URL}\" yarn test tests/integration/import-*.test.ts"

