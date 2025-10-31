# Research & Technical Decisions: First Production Release Preparation

**Feature**: 009-first-release-prep  
**Date**: October 30, 2025  
**Status**: Complete

## Overview

This document captures technical research, decisions, and best practices for implementing the first production release preparation feature. All "NEEDS CLARIFICATION" items from the plan have been researched and resolved.

---

## 1. Vercel Cron Jobs for Automated Sync

### Decision

Use Vercel Cron Jobs configured in `vercel.json` to trigger daily data synchronization from gomafia.pro every 24 hours.

### Rationale

- **Native Integration**: Built into Vercel platform, no external dependencies
- **Simple Configuration**: JSON-based configuration in project root
- **Reliable Execution**: Vercel handles scheduling, retries, and monitoring
- **Cost-Effective**: Included in Vercel plans, no additional service costs
- **Monitoring**: Built-in logs in Vercel dashboard
- **Timezone Support**: Supports cron expression with timezone specification

### Implementation Pattern

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

```typescript
// src/app/api/cron/daily-sync/route.ts
export async function GET(request: Request) {
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Trigger sync operation
  const result = await syncService.runIncrementalSync();

  return Response.json({ success: true, result });
}
```

### Alternatives Considered

- **GitHub Actions**: Requires separate workflow configuration, external to app, more complex secrets management
- **Upstash QStash**: Additional service dependency, extra cost, overkill for daily schedule
- **AWS EventBridge**: Requires AWS infrastructure, more complex setup
- **Manual Trigger**: Not reliable, requires admin intervention

### Best Practices

1. Use `CRON_SECRET` environment variable to authenticate cron requests
2. Set appropriate timeout for long-running sync operations
3. Implement idempotency to handle duplicate cron invocations
4. Log all cron executions for monitoring
5. Use UTC timezone for consistency: `"schedule": "0 2 * * *"` (2 AM UTC daily)

### References

- Vercel Cron Jobs Documentation: https://vercel.com/docs/cron-jobs
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 2. Supabase Storage for User Avatars

### Decision

Use Supabase Storage to store user avatar images with public URLs referenced in the User table.

### Rationale

- **Existing Integration**: Already using Supabase for PostgreSQL database and authentication
- **Seamless Auth**: Automatic integration with Supabase Auth for access control
- **CDN Distribution**: Built-in CDN for fast global delivery
- **Generous Free Tier**: 1GB storage, 2GB bandwidth per month
- **Simple API**: JavaScript SDK for upload, download, delete operations
- **Image Transformations**: Built-in image resizing and optimization
- **Access Control**: Row-level security policies for fine-grained permissions

### Implementation Pattern

```typescript
// src/lib/supabase/storage.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrl;
}
```

### Storage Bucket Configuration

- **Bucket Name**: `avatars`
- **Public Access**: Yes (public URLs for avatar display)
- **File Size Limit**: 2MB per avatar
- **Allowed MIME Types**: image/jpeg, image/png, image/webp, image/gif
- **Storage Policy**:

  ```sql
  -- Allow authenticated users to upload their own avatar
  CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

  -- Allow public read access
  CREATE POLICY "Public avatar access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
  ```

### Alternatives Considered

- **Vercel Blob Storage**: More expensive at scale, 100MB free tier vs 1GB for Supabase
- **Cloudinary**: Excellent for advanced transformations, but adds external dependency and cost
- **AWS S3**: More complex setup, requires separate AWS account and configuration
- **Database as Base64**: Poor performance, bloats database, not recommended

### Best Practices

1. Implement file size validation (max 2MB) before upload
2. Generate unique filenames to prevent collisions (`userId-timestamp.ext`)
3. Store public URL in database, not the file path
4. Implement avatar deletion when user updates (prevent orphaned files)
5. Use image optimization: `supabase.storage.from('avatars').download(path, { transform: { width: 200, height: 200 } })`
6. Set appropriate cache headers for CDN efficiency
7. Validate file types on both client and server

### References

- Supabase Storage Documentation: https://supabase.com/docs/guides/storage
- Supabase Storage RLS: https://supabase.com/docs/guides/storage/security/access-control

---

## 3. Admin Alert Notification System

### Decision

Implement dual notification system: in-app notifications + email alerts for sync failures.

### Rationale

- **Redundancy**: Ensures admins are notified even when not actively using the app
- **Immediate Visibility**: In-app notifications for logged-in admins
- **Reliability**: Email ensures notification delivery during off-hours
- **Audit Trail**: Email provides permanent record of alerts
- **Flexibility**: Can disable either channel based on admin preferences

### Implementation Pattern

**In-App Notifications**:

```typescript
// src/lib/notifications/inAppNotifications.ts
import { prisma } from '@/lib/db';

export async function createAdminNotification(
  type: 'SYNC_FAILURE' | 'SYNC_SUCCESS',
  message: string,
  details?: any
) {
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  });

  // Create notification for each admin
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type,
      message,
      details,
      read: false,
    })),
  });
}
```

**Email Alerts**:

```typescript
// src/lib/email/adminAlerts.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSyncFailureAlert(
  syncLog: SyncLog,
  adminEmails: string[]
) {
  await resend.emails.send({
    from: 'alerts@mafiainsight.com',
    to: adminEmails,
    subject: `[Mafia Insight] Data Sync Failed - ${new Date().toISOString()}`,
    html: `
      <h2>Data Synchronization Failure</h2>
      <p>The scheduled data sync from gomafia.pro failed.</p>
      <ul>
        <li><strong>Time:</strong> ${syncLog.startTime}</li>
        <li><strong>Error:</strong> ${syncLog.errors}</li>
        <li><strong>Records Processed:</strong> ${syncLog.recordsProcessed}</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/sync">View Sync Status</a></p>
    `,
  });
}
```

### Email Service Selection

**Chosen**: Resend.com

- Simple API, excellent TypeScript support
- 100 emails/day free tier (sufficient for admin alerts)
- React Email template support
- Good deliverability
- Vercel-native integration

**Alternative**: SendGrid, but more complex API and higher cost for low volume.

### Notification Schema

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      NotificationType
  message   String
  details   Json?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("notifications")
}

enum NotificationType {
  SYNC_FAILURE
  SYNC_SUCCESS
  SYSTEM_ALERT
}
```

### Best Practices

1. Rate limit notifications to prevent spam (max 1 email per hour for same type)
2. Batch multiple failures into single email if occurring rapidly
3. Include actionable links in email (direct to sync status page)
4. Mark in-app notifications as read when admin views sync status page
5. Implement notification preferences for admins (email on/off, frequency)
6. Use retry logic for email sending (3 attempts with exponential backoff)
7. Log all notification attempts for debugging

### Alternatives Considered

- **Webhook-based**: Too complex for internal notifications
- **SMS**: Expensive and unnecessary for non-critical alerts
- **Slack/Discord**: Requires separate integration, not all admins may have accounts

### References

- Resend Documentation: https://resend.com/docs
- React Email: https://react.email

---

## 4. Test Infrastructure Fixes

### Decision

Fix critical broken tests first (database connections, auth mocks, validation utilities), then add new comprehensive tests for untested features.

### Rationale

- **Foundation First**: Can't add new tests until infrastructure works
- **Efficiency**: Fix once, benefit all tests
- **TDD Enablement**: Enables proper TDD workflow for new features
- **Incremental Progress**: Clear milestone (infrastructure tests passing) before proceeding
- **Risk Reduction**: Prevents false positives/negatives from broken infrastructure

### Critical Infrastructure Issues Identified

**1. Database Connection Tests**:

```typescript
// Problem: Tests failing due to missing test database configuration
// tests/integration/database/connection.test.ts

// Solution: Use separate test database with proper cleanup
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_TEST,
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clean up test data after each test
  const tables = ['user', 'player', 'game', 'tournament'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
});
```

**2. Authentication Mocks**:

```typescript
// Problem: authService.isAuthenticated is not a function
// tests/__mocks__/supabase.ts

// Solution: Complete Supabase mock implementation
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    }),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
});
```

**3. Validation Utilities**:

```typescript
// Problem: Validation functions undefined in tests
// tests/unit/lib/validations.test.ts

// Solution: Ensure proper exports and imports
// src/lib/validations.ts
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

// Ensure these are properly imported in tests
import { validateEmail, validatePassword } from '@/lib/validations';
```

### Test Coverage Strategy

**Phase 1: Fix Infrastructure (Week 1)**

- Database connection tests ✓
- Authentication mock setup ✓
- Validation utility tests ✓
- API endpoint mock setup ✓

**Phase 2: New Feature Tests (Week 2)**

- Profile management tests (unit + E2E)
- Admin bootstrap tests (security focused)
- Sync notification tests (integration)
- Avatar upload tests (unit + integration)

**Phase 3: Coverage Gaps (Week 3)**

- Role-based access control tests
- Error boundary tests
- Data display tests (games, players, tournaments)
- Form validation tests

### Test Environment Setup

```bash
# .env.test
DATABASE_URL_TEST="postgresql://user:pass@localhost:5432/mafia_insight_test"
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="test-key"
RESEND_API_KEY="test-key"
CRON_SECRET="test-secret"
```

### Best Practices

1. Use separate test database that's reset between test runs
2. Mock external services (Supabase, Resend, gomafia.pro)
3. Use factories/fixtures for test data creation
4. Implement parallel test execution for speed
5. Use test coverage reports to identify gaps
6. Write integration tests for critical user flows
7. Use Playwright for E2E tests with visual regression testing

### Test Coverage Goals

- **Unit Tests**: 90% coverage for services and utilities
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user flows (5 user stories)
- **Total**: 90% overall pass rate before production

### References

- Vitest Documentation: https://vitest.dev
- Playwright Testing: https://playwright.dev
- Testing Library Best Practices: https://testing-library.com/docs/guiding-principles

---

## 5. Admin Bootstrap Security

### Decision

Implement secure admin bootstrap with two methods: command-line script and web-based bootstrap page with built-in security checks.

### Rationale

- **Flexibility**: CLI for automated deployments, web UI for manual setup
- **Security**: Both methods verify no existing admins before creating new one
- **Auditability**: All admin creation logged with timestamps
- **One-Time Use**: Bootstrap methods disabled after first admin exists
- **Deployment-Friendly**: Works in Vercel serverless environment

### Implementation Pattern

**Command-Line Script** (`scripts/create-first-admin.js`):

```javascript
#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFirstAdmin(email, name) {
  // Security check: ensure no admins exist
  const existingAdmins = await prisma.user.count({
    where: { role: 'admin' },
  });

  if (existingAdmins > 0) {
    console.error(
      '❌ Error: Admin users already exist. Use admin panel to create additional admins.'
    );
    process.exit(1);
  }

  // Generate secure password
  const password = require('crypto').randomBytes(16).toString('hex');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      role: 'admin',
      // Password will be set via email reset link
    },
  });

  console.log('✅ First admin created successfully!');
  console.log(`📧 Email: ${email}`);
  console.log(
    `🔗 Send password reset link to: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?email=${email}`
  );

  await prisma.$disconnect();
}

// Usage: node scripts/create-first-admin.js admin@example.com "Admin Name"
const [email, name] = process.argv.slice(2);
createFirstAdmin(email, name).catch(console.error);
```

**Web-Based Bootstrap** (`src/app/admin/bootstrap/page.tsx`):

```typescript
// Check if bootstrap is still available
async function isBootstrapAvailable() {
  const admins = await prisma.user.count({
    where: { role: 'admin' }
  });
  return admins === 0;
}

export default async function AdminBootstrap() {
  const available = await isBootstrapAvailable();

  if (!available) {
    return (
      <div>
        <h1>Bootstrap Not Available</h1>
        <p>Admin users already exist. Please log in or contact an existing administrator.</p>
      </div>
    );
  }

  return <AdminBootstrapForm />;
}
```

### Security Measures

1. **Existence Check**: Always verify no admins exist before creating
2. **Rate Limiting**: Limit bootstrap page access (10 attempts per hour per IP)
3. **Strong Passwords**: Enforce minimum 12 characters, complexity requirements
4. **Email Verification**: Send verification email before activating account
5. **Audit Logging**: Log all admin creation attempts with IP, timestamp
6. **One-Time Tokens**: Generate secure token for bootstrap page access
7. **HTTPS Only**: Enforce HTTPS in production for bootstrap endpoints

### Best Practices

1. Document bootstrap process in deployment documentation
2. Include bootstrap in CI/CD pipeline for fresh deployments
3. Disable bootstrap page after use (return 404)
4. Use environment variable to control bootstrap availability
5. Implement backup recovery method if bootstrap fails
6. Log failed bootstrap attempts for security monitoring

### Alternatives Considered

- **Database Seed Only**: Not flexible for production deployments
- **Environment Variable Password**: Security risk if exposed
- **OAuth-Only**: Complex for initial setup

### References

- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## 6. Data Verification Sampling Strategy

### Decision

Use 1% random sampling per entity type for data integrity verification between imported data and gomafia.pro source.

### Rationale

- **Scalability**: Sampling percentage scales with database growth
- **Statistical Significance**: 1% provides 95% confidence for large datasets
- **Performance**: Reasonable verification time (minutes vs hours for full scan)
- **Thoroughness**: For 10,000 players, verifies 100 records (statistically meaningful)
- **Balance**: Thorough enough to catch systematic issues, fast enough for automated checks

### Implementation Pattern

```typescript
// src/lib/integrity/dataVerification.ts
export async function verifySyncIntegrity(): Promise<DataIntegrityReport> {
  const report: DataIntegrityReport = {
    timestamp: new Date(),
    entities: [],
    overallAccuracy: 0,
  };

  // Verify Players
  const playerCount = await prisma.player.count();
  const playerSampleSize = Math.max(10, Math.ceil(playerCount * 0.01)); // Min 10, max 1%
  const playerSample = await prisma.player.findMany({
    take: playerSampleSize,
    orderBy: { createdAt: 'desc' }, // Recent data more important
    include: { yearStats: true },
  });

  let playerMatches = 0;
  for (const player of playerSample) {
    const sourceData = await scrapePlayerFromGoMafia(player.gomafiaId);
    if (comparePlayerData(player, sourceData)) {
      playerMatches++;
    }
  }

  report.entities.push({
    type: 'PLAYER',
    sampleSize: playerSampleSize,
    totalRecords: playerCount,
    matches: playerMatches,
    accuracy: (playerMatches / playerSampleSize) * 100,
    discrepancies: playerSampleSize - playerMatches,
  });

  // Repeat for Games, Tournaments, Clubs...

  // Calculate overall accuracy
  report.overallAccuracy =
    report.entities.reduce((sum, entity) => sum + entity.accuracy, 0) /
    report.entities.length;

  return report;
}
```

### Sampling Strategy

- **Minimum Sample**: 10 records per entity type (for small datasets)
- **Maximum Percentage**: 1% of total records
- **Sampling Method**: Random with bias toward recent records (more likely to have issues)
- **Comparison Fields**:
  - Players: name, ELO, total games, region
  - Games: date, participants, winner, tournament
  - Tournaments: name, dates, participants count, prize pool

### Verification Schedule

- **After Full Import**: Complete verification (may take 30+ minutes)
- **After Incremental Sync**: Quick verification (5-10 minutes)
- **Weekly**: Scheduled full verification with report
- **On-Demand**: Admin can trigger verification manually

### Accuracy Threshold

- **Target**: 99% accuracy (SC-009)
- **Warning**: 95-98% accuracy (investigate but don't block)
- **Alert**: <95% accuracy (send admin alert, investigate immediately)

### Best Practices

1. Store verification reports for trend analysis
2. Flag entities with repeated discrepancies for manual review
3. Implement retry logic for network failures during verification
4. Cache gomafia.pro responses to avoid rate limiting
5. Log all verification attempts with results
6. Provide detailed discrepancy reports (field-level differences)

### Performance Optimization

- Run verification during low-traffic hours (2-4 AM UTC)
- Use connection pooling for database queries
- Parallelize verification across entity types
- Implement timeout for verification process (max 30 minutes)

### References

- Statistical Sampling Theory: https://en.wikipedia.org/wiki/Sampling_(statistics)
- Data Quality Assessment: https://www.dataversity.net/data-quality-assessment-methodology/

---

## Summary

All technical decisions documented and resolved. Key takeaways:

1. **Vercel Cron Jobs**: Simple, reliable, cost-effective for daily sync
2. **Supabase Storage**: Integrated solution for avatar hosting with CDN
3. **Dual Notifications**: In-app + email for reliable admin alerts
4. **Test Strategy**: Fix infrastructure first, then add comprehensive coverage
5. **Admin Bootstrap**: Secure two-method approach (CLI + web) with safety checks
6. **Data Verification**: 1% sampling provides statistical confidence with reasonable performance

All technologies align with existing stack (Next.js, Supabase, Vercel) and constitutional requirements. No new architectural patterns introduced.

**Ready for Phase 1**: Data model updates and API contract generation.
