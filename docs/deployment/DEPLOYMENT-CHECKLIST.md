# Deployment Checklist: First Production Release

**Feature**: 009-first-release-prep  
**Date**: October 30, 2025  
**Target**: Production deployment with complete authentication, sync automation, and data verification

## Pre-Deployment Verification

### 1. Database Migrations

- [ ] **Run all migrations in staging first**

  ```bash
  # In staging environment
  npx prisma migrate deploy
  ```

- [ ] **Verify migrations applied successfully**
  ```bash
  npx prisma migrate status
  ```
- [ ] **Verify index creation**
  ```sql
  -- Check that all import indexes exist
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE tablename IN ('players', 'clubs', 'tournaments', 'games', 'player_year_stats', 'player_tournaments')
  ORDER BY tablename, indexname;
  ```

### 2. Environment Variables

- [ ] **Verify DATABASE_URL with connection pooling**

  ```
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10&connect_timeout=15"
  ```

- [ ] **Verify DIRECT_URL for migrations**

  ```
  DIRECT_URL="postgresql://user:pass@host:5432/db"
  ```

- [ ] **Verify GOMAFIA_BASE_URL**

  ```
  GOMAFIA_BASE_URL="https://gomafia.pro"
  ```

- [ ] **Verify CRON_SECRET for Vercel Cron authentication**

  ```
  CRON_SECRET="<32-byte-hex-string>"
  ```

  Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

- [ ] **Verify RESEND_API_KEY for admin email alerts**

  ```
  RESEND_API_KEY="re_xxxxxxxxxxxx"
  ```

- [ ] **Verify monitoring/error tracking**

  ```
  SENTRY_DSN="your-sentry-dsn"
  ```

- [ ] **Set appropriate NODE_ENV**
  ```
  NODE_ENV="production"
  ```

### 3. Database Configuration

- [ ] **Verify PostgreSQL max_connections**

  ```sql
  SHOW max_connections;  -- Should be ≥40 for 20 connection_limit per instance
  ```

- [ ] **Verify database has sufficient storage**
  - Estimated: 500MB-5GB for full import
  - Check available space: `SELECT pg_size_pretty(pg_database_size('your_db_name'));`

- [ ] **Verify advisory lock support**
  ```sql
  -- Test advisory lock function
  SELECT pg_try_advisory_lock(123456789);
  SELECT pg_advisory_unlock(123456789);
  ```

### 4. Application Build

- [ ] **Build application successfully**

  ```bash
  yarn build
  ```

- [ ] **Verify no TypeScript errors**

  ```bash
  yarn type-check
  ```

- [ ] **Verify linting passes**

  ```bash
  yarn lint
  ```

- [ ] **Run test suite**
  ```bash
  yarn test
  ```

### 5. Test Data Import

- [ ] **Test import in staging with real gomafia.pro data**
  - Visit `/import` page
  - Click "Start Import"
  - Verify progress updates every 2 seconds
  - Monitor for 15-30 minutes
  - Check validation rate ≥98%

- [ ] **Test import cancellation**
  - Start import
  - Click "Cancel Import"
  - Verify graceful stop with checkpoint preservation

- [ ] **Test import resume**
  - Start import
  - Stop application mid-import
  - Restart application
  - Click "Resume Import"
  - Verify continues from checkpoint

### 6. Performance Validation

- [ ] **Verify rate limiting (2 seconds between requests)**
  - Monitor network logs during import
  - Confirm max 30 requests/minute to gomafia.pro

- [ ] **Verify batch processing (100 records per batch)**
  - Check SyncLog records for batch sizes
  - Verify memory usage stays stable

- [ ] **Verify advisory lock prevents concurrent imports**
  - Trigger import from UI
  - Attempt second import via API
  - Confirm 409 Conflict response

## Deployment Steps

### Phase 1: Database Migration

1. **Backup production database**

   ```bash
   pg_dump -h host -U user -d db_name > backup_pre_import_$(date +%Y%m%d).sql
   ```

2. **Run migrations on production**

   ```bash
   npx prisma migrate deploy
   ```

3. **Verify migrations**
   ```bash
   npx prisma migrate status
   ```

### Phase 2: Application Deployment

1. **Deploy application to production**
   - For Vercel: Push to main branch (automatic deployment)
   - For custom hosting: Build and deploy artifact

2. **Verify deployment health**

   ```bash
   curl https://your-domain.com/api/health
   ```

3. **Smoke test key endpoints**

   ```bash
   # Check empty database detection
   curl https://your-domain.com/api/gomafia-sync/import/check-empty

   # Check sync status endpoint
   curl https://your-domain.com/api/gomafia-sync/sync/status
   ```

### Phase 3: Import Trigger

1. **Monitor application logs**
   - Tail logs in real-time
   - Watch for import-related messages

2. **Trigger initial import**
   - Option A: Visit `/players` page (auto-trigger)
   - Option B: Visit `/import` page and click "Start Import"

3. **Monitor import progress**
   - Check SyncStatus table for progress updates
   - Monitor validation metrics
   - Watch for errors in Sentry

### Phase 4: Validation

1. **Wait for import completion** (3-4 hours estimated)

2. **Verify data integrity**

   ```sql
   -- Check record counts
   SELECT 'players' as table_name, COUNT(*) FROM players
   UNION ALL
   SELECT 'clubs', COUNT(*) FROM clubs
   UNION ALL
   SELECT 'tournaments', COUNT(*) FROM tournaments
   UNION ALL
   SELECT 'games', COUNT(*) FROM games
   UNION ALL
   SELECT 'player_year_stats', COUNT(*) FROM player_year_stats
   UNION ALL
   SELECT 'player_tournaments', COUNT(*) FROM player_tournaments;
   ```

3. **Verify referential integrity**

   ```sql
   -- Check for orphaned records
   SELECT COUNT(*) FROM game_participations gp
   LEFT JOIN players p ON gp."playerId" = p.id
   WHERE p.id IS NULL;
   -- Should return 0

   SELECT COUNT(*) FROM game_participations gp
   LEFT JOIN games g ON gp."gameId" = g.id
   WHERE g.id IS NULL;
   -- Should return 0
   ```

4. **Check validation metrics**

   ```sql
   -- Get latest sync log
   SELECT * FROM sync_logs
   WHERE type = 'FULL'
   ORDER BY "startTime" DESC
   LIMIT 1;
   ```

5. **Verify sync status**
   ```sql
   SELECT * FROM sync_status WHERE id = 'current';
   -- Check validationRate >= 0.98
   ```

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor error rates in Sentry
- [ ] Check database connection pool usage
- [ ] Monitor API response times
- [ ] Verify no memory leaks
- [ ] Check for failed import retries

### First Week

- [ ] Review SyncLog for any recurring errors
- [ ] Analyze validation metrics trends
- [ ] Check for performance degradation
- [ ] Monitor disk space usage
- [ ] Review user feedback on import feature

## Rollback Plan

### If Critical Issues Arise

1. **Stop import if running**

   ```bash
   # Via API
   curl -X DELETE https://your-domain.com/api/gomafia-sync/import
   ```

2. **Rollback application**
   - Deploy previous version
   - Verify health checks pass

3. **Rollback database (if needed)**

   ```bash
   # Restore from backup
   psql -h host -U user -d db_name < backup_pre_import_YYYYMMDD.sql
   ```

4. **Notify stakeholders**
   - Document issue encountered
   - Provide timeline for resolution

## Success Criteria

- [ ] Import completes within 3-4 hours (or 12-hour timeout)
- [ ] Validation rate ≥98%
- [ ] No referential integrity violations
- [ ] Database contains ≥1,000 players and ≥5,000 games
- [ ] All advisory locks released properly
- [ ] No memory leaks during import
- [ ] Rate limiting respected (30 req/min to gomafia.pro)
- [ ] Progress updates visible in UI every 2 seconds
- [ ] Import can be cancelled and resumed successfully

## Troubleshooting

### Import Stuck/Timeout

**Symptom**: Import running >12 hours  
**Action**:

1. Check TimeoutManager logs for timeout detection
2. Cancel import via API: `DELETE /api/gomafia-sync/import`
3. Check checkpoint in SyncStatus table
4. Review SyncLog for phase where stuck occurred
5. Resume import: `POST /api/gomafia-sync/import?resume=true`

### Advisory Lock Not Released

**Symptom**: Cannot start new import, lock appears stuck  
**Action**:

```sql
-- Check active advisory locks
SELECT * FROM pg_locks WHERE locktype = 'advisory';

-- Manually release all advisory locks (last resort)
SELECT pg_advisory_unlock_all();
```

### Low Validation Rate (<98%)

**Symptom**: validationRate in SyncStatus < 0.98  
**Action**:

1. Check SyncLog.errors for validation failures
2. Review error patterns (e.g., specific entity types failing)
3. Check gomafia.pro for schema changes
4. Update Zod validators if needed
5. Re-run import with fixes

### Rate Limit Violations

**Symptom**: HTTP 429 errors from gomafia.pro  
**Action**:

1. Verify RateLimiter enforcement (2000ms delay)
2. Check for concurrent scraping instances
3. Increase delay if needed: Update SYNC_RATE_LIMIT_MS env var
4. Wait 5-10 minutes before resuming

### Database Connection Pool Exhaustion

**Symptom**: "Too many clients already" errors  
**Action**:

1. Check active connections: `SELECT count(*) FROM pg_stat_activity;`
2. Reduce connection_limit in DATABASE_URL
3. Increase PostgreSQL max_connections
4. Check for connection leaks in application

## Contacts

**DevOps Team**: devops@mafia-insight.com  
**Database Admin**: dba@mafia-insight.com  
**On-Call Engineer**: oncall@mafia-insight.com  
**Sentry Dashboard**: https://sentry.io/organizations/mafia-insight  
**Monitoring Dashboard**: (Add your monitoring URL)

---

**Last Updated**: October 26, 2025  
**Prepared By**: AI Assistant  
**Reviewed By**: (Add reviewer names)
