#!/bin/bash

# Setup test database for E2E tests
set -e

echo "Setting up test database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create test database if it doesn't exist
createdb mafia_insight_test 2>/dev/null || echo "Database mafia_insight_test already exists"

# Run Prisma migrations for test database
export DATABASE_URL="postgresql://test:test@localhost:5432/mafia_insight_test"
npx prisma migrate deploy

# Seed test data
npx prisma db seed

echo "Test database setup complete!"
