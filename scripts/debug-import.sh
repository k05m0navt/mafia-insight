#!/bin/bash
# Debug Import Script
# Run this to check import health and troubleshoot issues

echo "=== Import Health Check ==="
echo ""

echo "1. Checking if app is running..."
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ App is running"
else
  echo "❌ App is not running. Start with: yarn dev"
  exit 1
fi

echo ""
echo "2. Checking database connection..."
npx prisma db pull --force > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database connected"
else
  echo "❌ Database connection failed. Check DATABASE_URL"
  exit 1
fi

echo ""
echo "3. Checking if database is empty..."
EMPTY_CHECK=$(curl -s http://localhost:3000/api/gomafia-sync/import/check-empty)
echo "$EMPTY_CHECK"

echo ""
echo "4. Checking current import status..."
STATUS=$(curl -s http://localhost:3000/api/gomafia-sync/sync/status)
echo "$STATUS" | jq '.' 2>/dev/null || echo "$STATUS"

echo ""
echo "5. Checking migrations status..."
npx prisma migrate status

echo ""
echo "=== Health Check Complete ==="
echo ""
echo "Next steps:"
echo "  - View import UI: http://localhost:3000/import"
echo "  - View Prisma Studio: npx prisma studio"
echo "  - Trigger import: curl -X POST http://localhost:3000/api/gomafia-sync/import"

