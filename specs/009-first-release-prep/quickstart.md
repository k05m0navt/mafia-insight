# Quickstart: First Production Release Preparation

**Feature**: 009-first-release-prep  
**Estimated Time**: 2-3 weeks  
**Prerequisites**: Existing Next.js 14 app with Supabase, Prisma, and Vercel account

## Overview

This quickstart guide provides a rapid implementation path for preparing the Mafia Insight application for its first production release. Follow these steps in order for the most efficient implementation.

---

## Week 1: Authentication & Profile Management

### Day 1-2: Fix Authentication UX & Name Storage

**Goal**: Fix login feedback, ensure signup stores name properly

```bash
# 1. Update login API route
#    File: src/app/api/auth/login/route.ts

# 2. Add success notification after login
#    Return: { success: true, message: "Welcome back, [Name]!" }

# 3. Fix signup name storage
#    File: src/app/api/auth/signup/route.ts
#    Ensure: name field is included in Prisma create()

# 4. Update lastLogin on successful login
await prisma.user.update({
  where: { id: user.id },
  data: { lastLogin: new Date() }
});
```

**Test**:

```bash
# Verify name storage
yarn test tests/integration/api/auth.test.ts

# Manual test: Sign up, check database
yarn db:studio
# Verify User table has name populated
```

---

### Day 3-4: Profile UI in Navbar

**Goal**: Add profile dropdown menu in navbar

```bash
# 1. Create ProfileDropdown component
#    File: src/components/layout/ProfileDropdown.tsx

# 2. Update Navbar component
#    File: src/components/layout/Navbar.tsx
#    Add: <ProfileDropdown user={user} />

# 3. Use useAuth hook for current user
import { useAuth } from '@/hooks/useAuth';
const { user } = useAuth();
```

**Component Structure**:

```tsx
// ProfileDropdown.tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar src={user.avatar} alt={user.name} />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Sign Out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Test**:

```bash
yarn test:e2e tests/e2e/auth/profile-dropdown.spec.ts
```

---

### Day 5: Create Profile Page

**Goal**: Dedicated profile page with edit functionality

```bash
# 1. Create profile page
#    File: src/app/profile/page.tsx

# 2. Create ProfileEditor component
#    File: src/components/profile/ProfileEditor.tsx

# 3. Create profile API endpoints
#    File: src/app/api/profile/route.ts
#    Methods: GET (retrieve), PATCH (update)
```

**API Implementation**:

```typescript
// GET /api/profile
export async function GET(request: Request) {
  const session = await getSession(request);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      subscriptionTier: true,
      themePreference: true,
      createdAt: true,
      lastLogin: true,
    },
  });
  return NextResponse.json(user);
}
```

**Test**:

```bash
yarn test:e2e tests/e2e/profile/profile-management.spec.ts
```

---

### Day 6-7: Avatar Upload with Supabase Storage

**Goal**: Allow users to upload and manage avatars

```bash
# 1. Set up Supabase Storage bucket
#    Bucket name: "avatars"
#    Public access: Yes
#    File size limit: 2MB

# 2. Create avatar service
#    File: src/services/storage/avatarService.ts

# 3. Create avatar upload API
#    File: src/app/api/profile/avatar/route.ts

# 4. Create AvatarUpload component
#    File: src/components/profile/AvatarUpload.tsx
```

**Supabase Storage Setup**:

```sql
-- Run in Supabase SQL Editor
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create upload policy
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create read policy
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Avatar Service**:

```typescript
// src/services/storage/avatarService.ts
export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName);

  return publicUrl;
}
```

**Test**:

```bash
yarn test tests/integration/services/avatarService.test.ts
```

---

## Week 2: Admin Management & Sync System

### Day 8-9: Admin Bootstrap

**Goal**: Easy first admin creation + admin management panel

```bash
# 1. Create admin bootstrap page
#    File: src/app/admin/bootstrap/page.tsx

# 2. Create bootstrap API
#    File: src/app/api/admin/bootstrap/route.ts

# 3. Create CLI script
#    File: scripts/create-first-admin.js

# 4. Update admin panel
#    File: src/app/admin/users/page.tsx
```

**Bootstrap Security**:

```typescript
// Check if bootstrap is available
async function isBootstrapAvailable() {
  const adminCount = await prisma.user.count({
    where: { role: 'admin' },
  });
  return adminCount === 0;
}

// Only allow if no admins exist
if (!(await isBootstrapAvailable())) {
  return NextResponse.json(
    { error: 'Admin users already exist' },
    { status: 403 }
  );
}
```

**CLI Script**:

```bash
# Usage:
node scripts/create-first-admin.js admin@example.com "Admin Name"

# Verification:
yarn db:studio
# Check User table for admin role
```

**Test**:

```bash
yarn test:e2e tests/e2e/admin/admin-bootstrap.spec.ts
```

---

### Day 10-11: Vercel Cron & Sync Automation

**Goal**: Automated 24-hour data synchronization

```bash
# 1. Add Vercel Cron configuration
#    File: vercel.json (root)

# 2. Create cron handler
#    File: src/app/api/cron/daily-sync/route.ts

# 3. Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Add to Vercel environment variables
#    CRON_SECRET=<generated-secret>
```

**vercel.json**:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Cron Handler**:

```typescript
// src/app/api/cron/daily-sync/route.ts
export async function GET(request: Request) {
  // Verify Vercel Cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Run incremental sync
  const result = await syncService.runIncrementalSync();

  // Send notifications on failure
  if (result.status === 'FAILED') {
    await notificationService.notifyAdmins({
      type: 'SYNC_FAILURE',
      title: 'Data Sync Failed',
      message: result.error,
    });
  }

  return Response.json({ success: true, result });
}
```

**Test**:

```bash
# Local test
curl -X GET http://localhost:3000/api/cron/daily-sync \
  -H "Authorization: Bearer your-cron-secret"

# Integration test
yarn test tests/integration/api/cron/daily-sync.test.ts
```

---

### Day 12-13: Notification System

**Goal**: In-app + email notifications for sync failures

```bash
# 1. Create Notification model migration
yarn prisma migrate dev --name add_notifications

# 2. Create notification service
#    File: src/services/sync/notificationService.ts

# 3. Set up Resend for email
yarn add resend

# 4. Create notification API
#    File: src/app/api/notifications/route.ts

# 5. Create notification UI component
#    File: src/components/sync/SyncNotifications.tsx
```

**Notification Service**:

```typescript
// src/services/sync/notificationService.ts
export async function notifyAdmins(notification: {
  type: string;
  title: string;
  message: string;
  details?: any;
}) {
  // 1. Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true },
  });

  // 2. Create in-app notifications
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      details: notification.details,
    })),
  });

  // 3. Send email alerts
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'alerts@mafiainsight.com',
    to: admins.map((a) => a.email),
    subject: notification.title,
    html: `<p>${notification.message}</p>`,
  });
}
```

**Test**:

```bash
yarn test tests/integration/services/notificationService.test.ts
```

---

### Day 14: Data Integrity Verification

**Goal**: 1% sampling verification system

```bash
# 1. Create DataIntegrityReport model
yarn prisma migrate dev --name add_integrity_reports

# 2. Create verification service
#    File: src/lib/integrity/dataVerification.ts

# 3. Create verification API
#    File: src/app/api/gomafia-sync/integrity/verify/route.ts
```

**Verification Logic**:

```typescript
export async function verifySyncIntegrity() {
  // 1% sample size per entity
  const playerCount = await prisma.player.count();
  const sampleSize = Math.max(10, Math.ceil(playerCount * 0.01));

  // Get random sample
  const sample = await prisma.player.findMany({
    take: sampleSize,
    orderBy: { createdAt: 'desc' },
  });

  // Verify against gomafia.pro
  let matches = 0;
  for (const player of sample) {
    const sourceData = await scrapePlayerFromGoMafia(player.gomafiaId);
    if (comparePlayerData(player, sourceData)) matches++;
  }

  const accuracy = (matches / sampleSize) * 100;

  // Create report
  await prisma.dataIntegrityReport.create({
    data: {
      overallAccuracy: accuracy,
      entities: JSON.stringify([
        {
          type: 'PLAYER',
          sampleSize,
          totalRecords: playerCount,
          matches,
          accuracy,
        },
      ]),
      status: 'COMPLETED',
    },
  });

  return { accuracy, matches, sampleSize };
}
```

**Test**:

```bash
yarn test tests/integration/lib/dataVerification.test.ts
```

---

## Week 3: Testing & Cleanup

### Day 15-17: Fix Test Infrastructure

**Goal**: Achieve 90% test pass rate

**Priority Order**:

1. Fix database connection tests
2. Fix authentication mocks
3. Fix validation utility tests
4. Add new tests for profile features
5. Add new tests for admin features

**Database Test Setup**:

```typescript
// tests/setup.ts
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
  // Clean up test data
  const tables = ['notification', 'user', 'player', 'game'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
});
```

**Run Tests**:

```bash
# Fix infrastructure tests
yarn test tests/integration/database/

# Add new tests
yarn test tests/e2e/auth/
yarn test tests/e2e/profile/
yarn test tests/e2e/admin/

# Check coverage
yarn test:coverage
# Target: 90% pass rate
```

---

### Day 18-19: Codebase Cleanup

**Goal**: Remove unused files, update documentation

```bash
# 1. Find unused files
find src -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  grep -r "$(basename $file .tsx)" src/ > /dev/null || echo "Unused: $file"
done

# 2. Remove unused files
rm -rf <identified-unused-files>

# 3. Update documentation
# Files to update:
# - docs/README.md
# - docs/auth/README.md
# - docs/deployment/README.md
# - docs/deployment/DEPLOYMENT-CHECKLIST.md

# 4. Run linter
yarn lint:fix

# 5. Format code
yarn format
```

---

### Day 20-21: Vercel Deployment Preparation

**Goal**: Ensure successful Vercel deployment

```bash
# 1. Update environment variables in Vercel
# Required variables:
- DATABASE_URL
- DIRECT_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- CRON_SECRET
- RESEND_API_KEY

# 2. Test build locally
yarn build

# 3. Run production mode locally
yarn start

# 4. Deploy to Vercel preview
git push origin 009-first-release-prep

# 5. Test preview deployment
# - Test authentication
# - Test profile page
# - Test admin bootstrap
# - Trigger manual sync
# - Verify cron configuration

# 6. Merge to main and deploy to production
git checkout main
git merge 009-first-release-prep
git push origin main
```

**Deployment Checklist**:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] Supabase Storage bucket created
- [ ] vercel.json includes cron configuration
- [ ] CRON_SECRET generated and configured
- [ ] Email service (Resend) API key configured
- [ ] Build completes without errors or warnings
- [ ] All tests pass (90% pass rate)
- [ ] First admin can be created via bootstrap
- [ ] Profile page loads and edits work
- [ ] Avatar upload works
- [ ] Notifications display correctly
- [ ] Manual sync can be triggered
- [ ] Data displays without errors (games, players, tournaments)

---

## Quick Commands Reference

```bash
# Development
yarn dev                  # Start dev server
yarn build                # Build for production
yarn start                # Run production build

# Testing
yarn test                 # Run all tests
yarn test:e2e            # Run E2E tests
yarn test:coverage       # Run with coverage report

# Database
yarn db:generate         # Generate Prisma client
yarn db:migrate          # Run migrations
yarn db:studio           # Open Prisma Studio
yarn db:seed             # Seed database

# Deployment
git push origin main     # Deploy to production
vercel                   # Deploy to preview

# Admin Management
node scripts/create-first-admin.js <email> "<name>"
```

---

## Common Issues & Solutions

### Issue: Signup not storing name

**Solution**: Ensure Prisma create includes name field

```typescript
const user = await prisma.user.create({
  data: { email, name, password: hashedPassword },
});
```

### Issue: Avatar upload fails

**Solution**: Verify Supabase Storage bucket exists and policies are set

### Issue: Cron not executing

**Solution**: Check CRON_SECRET matches in Vercel environment variables

### Issue: Tests failing

**Solution**: Ensure DATABASE_URL_TEST is set and test database exists

### Issue: Build errors

**Solution**: Run `yarn lint:fix` and fix TypeScript errors

---

## Success Verification

After completing all steps, verify:

1. ✅ Users can log in and see welcome message
2. ✅ Users can access profile from navbar dropdown
3. ✅ Users can edit profile and upload avatar
4. ✅ First admin can be created via bootstrap
5. ✅ Admins can create new admin users
6. ✅ Data syncs automatically every 24 hours
7. ✅ Admins receive notifications on sync failures
8. ✅ Games, players, tournaments display correctly
9. ✅ Test suite achieves 90% pass rate
10. ✅ Application deploys successfully to Vercel

**Congratulations!** The application is ready for its first production release. 🎉

---

**Next Steps**: Run `/speckit.tasks` to generate detailed implementation tasks with time estimates.
