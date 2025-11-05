# Fixing Database Connection Issues from Russia

## Problem

When accessing the `/players` page from Russia, you may encounter connection errors:

```
Error [PrismaClientKnownRequestError]:
Invalid `prisma.player.findMany()` invocation:

Can't reach database server at `aws-1-eu-north-1.pooler.supabase.com:5432`
```

This error occurs because Supabase's **direct database connections use IPv6 by default**, which may not be available from all regions (including Russia).

## Important: FREE Solution Available!

**You do NOT need to pay for the IPv4 add-on!** Supabase provides a **FREE shared connection pooler (Supavisor)** that supports both IPv4 and IPv6. This is included with every Supabase project at no additional cost.

## Solution

The code has been updated to handle this issue in two ways:

### 1. Automatic Connection Optimization

The `src/lib/db.ts` file now automatically:

- Adds `pgbouncer=true` parameter (required for Supavisor pooler)
- Increases connection timeouts (`connect_timeout=30`, `pool_timeout=60`)
- Sets connection limits to prevent overwhelming the pooler
- Provides warnings if using direct connection URLs

### 2. Retry Logic

The `/api/players` route now uses `resilientDB` wrapper which:

- Automatically retries failed connections (up to 3 attempts)
- Uses exponential backoff (1s, 2s, 4s delays)
- Handles P1001 errors (Can't reach database server)

## Recommended: Update DATABASE_URL

For the best compatibility from Russia, update your `DATABASE_URL` to use **Supavisor pooler** instead of direct connection:

### Step 1: Get Your FREE Pooler Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Click **Connect** button
4. Select **Connection pooling** → **Transaction mode** (port 6543) or **Session mode** (port 5432)
   - **Transaction mode** (port 6543): Best for serverless/edge functions (Next.js API routes)
   - **Session mode** (port 5432): Best for persistent servers
   - **Both are FREE** and support IPv4 and IPv6!

### Step 2: Update Environment Variables

**For Transaction Mode (Recommended for serverless/edge functions):**

```bash
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**For Session Mode (Recommended for persistent servers):**

```bash
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Example:**

```bash
DATABASE_URL="postgres://postgres.fgjfyixytmoiwkdmvkju:your-password@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Step 3: Verify Connection

The connection string should:

- Contain `.pooler.supabase.com` (not direct connection)
- Use port `6543` (transaction mode) or `5432` (session mode)
- Include `?pgbouncer=true` for transaction mode

## Why This Works

1. **FREE IPv4 Compatibility**: Supavisor pooler (included with every project) supports both IPv4 and IPv6, while direct connections are IPv6-only
2. **No Paid Add-on Needed**: Unlike the direct connection which requires IPv4 add-on ($), the pooler works with IPv4 for free
3. **Connection Pooling**: Reduces connection overhead and improves reliability
4. **Retry Logic**: Automatic retries handle transient connection issues
5. **Increased Timeouts**: Better handling of slow connections from distant regions

## Cost Comparison

- ❌ **Direct Connection + IPv4 Add-on**: Requires paid add-on (~$4/month)
- ✅ **Supavisor Pooler**: **FREE** (included with every Supabase project)
- ✅ **Best Option**: Use Supavisor pooler - it's free and works with IPv4!

## Testing

After updating your `DATABASE_URL`:

1. Restart your development server
2. Try accessing the `/players` page
3. Check server logs for connection warnings (if using direct connection)
4. Verify that the connection succeeds

## Additional Resources

- [Supabase Connection Pooling Documentation](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase IPv6 Transition Guide](https://github.com/orgs/supabase/discussions/20951)
- [Prisma with Supabase Troubleshooting](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)

## Troubleshooting

If you still experience issues:

1. **Check your current DATABASE_URL**: The code will warn you if you're using a direct connection
2. **Verify pooler URL format**: Ensure it contains `.pooler.supabase.com`
3. **Check network restrictions**: Ensure your Supabase project allows connections from your IP
4. **Try Session Mode**: If transaction mode doesn't work, try session mode (port 5432)
5. **Contact Supabase Support**: If issues persist, they may need to whitelist your region
