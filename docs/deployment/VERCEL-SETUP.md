# Vercel Deployment Setup

## Overview

This guide walks through deploying Mafia Insight to Vercel, including environment configuration, Cron Jobs, and post-deployment verification.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`
- GitHub repository connected to Vercel
- Supabase project set up
- PostgreSQL database accessible
- Resend API key (for email alerts)

## Step 1: Initial Project Setup

### Connect Repository

1. **Visit [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Add New Project"**
3. **Import your GitHub repository**
4. **Framework Preset**: Next.js (auto-detected)
5. **Root Directory**: `./` (default)

### Build Settings

- **Build Command**: `yarn build`
- **Output Directory**: `.next` (default)
- **Install Command**: `yarn install`
- **Development Command**: `yarn dev`

## Step 2: Environment Variables

### Required Variables

Navigate to **Project Settings → Environment Variables** and add the following:

#### Database

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

#### Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### Application

```bash
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

#### Email (Resend)

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="alerts@yourdomain.com"
```

#### Cron Authentication

```bash
CRON_SECRET="your-32-byte-hex-secret"
```

Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Scope

Set all variables for:

- ✅ Production
- ✅ Preview (optional)
- ✅ Development (local only)

## Step 3: Database Migrations

### Run Migrations Before First Deploy

```bash
# Set DATABASE_URL in your local .env
export DATABASE_URL="your-production-database-url"

# Run Prisma migrations
yarn prisma migrate deploy

# Generate Prisma Client
yarn prisma generate
```

### Verify Migration Status

```bash
yarn prisma migrate status
```

Expected output:

```
Database schema is up to date!
```

## Step 4: Configure Vercel Cron Jobs

Cron jobs are configured in `vercel.json`:

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

### Cron Job Schedule

- **Daily Sync**: `0 2 * * *` (2 AM UTC daily)
  - Endpoint: `/api/cron/daily-sync`
  - Function: Incremental data sync from gomafia.pro

### Verify Cron Configuration

1. **Deploy the project**
2. **Go to Project Settings → Cron Jobs**
3. **Verify "Daily Sync" is listed**
4. **Test manually**: Click "Run Now" button

### Manual Cron Testing

```bash
curl -X GET \
  https://your-app.vercel.app/api/cron/daily-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:

```json
{
  "success": true,
  "message": "Daily incremental sync completed",
  "syncLogId": "uuid",
  "syncResult": {
    "success": true,
    "recordsProcessed": 150
  }
}
```

## Step 5: Deploy

### Initial Deployment

```bash
# From project root
vercel --prod
```

Or push to `main` branch (auto-deploys if GitHub integration is set up).

### Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Cron jobs configured

## Step 6: Post-Deployment Verification

### 1. Test Authentication

- **Visit**: `https://your-app.vercel.app/login`
- **Try logging in with test credentials**
- **Verify redirect to `/players`**

### 2. Test Admin Bootstrap

- **Visit**: `https://your-app.vercel.app/admin/bootstrap`
- **Create first admin account**
- **Verify admin access to `/admin/users`**

### 3. Test Data Display

- **Visit**: `https://your-app.vercel.app/players`
- **Verify players load successfully**
- **Test sorting and filtering**

### 4. Test Manual Sync (Admin)

- **Login as admin**
- **Visit**: `/admin/sync`
- **Trigger manual sync**
- **Verify sync completes and data updates**

### 5. Test Cron Job

- **Go to Vercel Dashboard → Cron Jobs**
- **Click "Run Now" on Daily Sync**
- **Check logs for successful execution**
- **Verify email alert received (if failure)**

### 6. Check Logs

```bash
# View production logs
vercel logs --prod
```

Or use Vercel Dashboard → Deployment → Logs.

## Step 7: Domain Configuration

### Custom Domain (Optional)

1. **Go to Project Settings → Domains**
2. **Add your custom domain**: `mafiainsight.com`
3. **Follow DNS configuration instructions**
4. **Update `NEXT_PUBLIC_APP_URL` environment variable**

```bash
NEXT_PUBLIC_APP_URL="https://mafiainsight.com"
```

5. **Redeploy to apply changes**

## Monitoring & Maintenance

### Vercel Analytics

- **Enable**: Project Settings → Analytics
- **View**: Dashboard → Analytics tab
- **Metrics**: Page views, performance, errors

### Error Tracking

- **Vercel Logs**: Real-time logs in dashboard
- **Sentry Integration** (recommended): Add error tracking
- **Custom Logging**: Check `/api/logs` endpoints

### Performance Monitoring

- **Lighthouse CI**: Integrate for performance checks
- **Web Vitals**: Monitor Core Web Vitals in Analytics
- **Edge Network**: Verify global CDN performance

### Database Maintenance

- **Backup Strategy**: Enable automated backups in your database provider
- **Connection Pooling**: Use PgBouncer or similar
- **Monitor Queries**: Use Prisma Studio or database tools

## Troubleshooting

### Build Failures

**Error**: "Prisma Client not generated"

**Solution**:

```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```

**Error**: "Environment variable not found"

**Solution**:

- Verify all required env vars are set in Vercel
- Check variable names match exactly (case-sensitive)

### Runtime Errors

**Error**: "Cannot connect to database"

**Solution**:

- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel IP ranges
- Ensure SSL is configured if required

**Error**: "Cron job unauthorized (401)"

**Solution**:

- Verify `CRON_SECRET` is set in Vercel
- Check `Authorization` header format in cron handler

### Cron Job Issues

**Cron job not running**:

- Verify `vercel.json` is committed to repository
- Check Cron Jobs tab in Vercel dashboard
- Ensure path matches your API route exactly

**Cron job fails silently**:

- Check function logs in Vercel dashboard
- Verify endpoint works with manual `curl` test
- Check timeout limits (Vercel Hobby: 10s, Pro: 60s)

## Best Practices

1. ✅ **Use environment-specific variables** (production vs preview)
2. ✅ **Enable Vercel Web Analytics** for monitoring
3. ✅ **Set up custom domain** for production
4. ✅ **Configure automatic previews** for pull requests
5. ✅ **Monitor function execution time** (avoid timeouts)
6. ✅ **Use Edge Functions** for fast global response times
7. ✅ **Enable auto-redeploy** on dependency updates (Renovate Bot)
8. ✅ **Set up alerting** for deployment failures

## Rollback Strategy

### Instant Rollback

1. **Go to Vercel Dashboard → Deployments**
2. **Find last working deployment**
3. **Click "..." menu → "Promote to Production"**

### Manual Rollback

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

## Scaling Considerations

### Vercel Pro Features (if needed)

- **Increased function timeout** (60s vs 10s)
- **More concurrent builds**
- **Advanced analytics**
- **Password protection for previews**
- **Team collaboration**

### Database Scaling

- **Connection pooling**: Use PgBouncer
- **Read replicas**: For high-traffic scenarios
- **Caching**: Implement Redis for frequently accessed data

## Next Steps

- [ ] Set up monitoring dashboard (Datadog, New Relic)
- [ ] Configure CDN for static assets
- [ ] Implement advanced caching strategies
- [ ] Set up automated backup and restore procedures
- [ ] Configure rate limiting for API routes
- [ ] Enable DDoS protection
- [ ] Set up staging environment
