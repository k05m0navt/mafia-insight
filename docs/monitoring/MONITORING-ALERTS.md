# Monitoring & Alerts: GoMafia Data Import Feature

**Feature**: 003-gomafia-data-import  
**Date**: October 26, 2025  
**Purpose**: Define monitoring strategy and alert thresholds for import operations

## Overview

This document outlines the monitoring metrics, alert thresholds, and response procedures for the GoMafia data import feature. The goal is to detect and respond to issues before they impact users or data quality.

## Monitoring Stack

### Recommended Tools

1. **Application Monitoring**: Sentry for error tracking
2. **Database Monitoring**: PostgreSQL logs + Supabase Dashboard
3. **Metrics Collection**: Custom metrics via SyncLog/SyncStatus tables
4. **Log Aggregation**: Vercel logs or CloudWatch (depending on hosting)
5. **Uptime Monitoring**: UptimeRobot or Pingdom
6. **APM**: New Relic or Datadog (optional, for detailed performance)

## Key Metrics to Monitor

### Import Operation Metrics

#### 1. Import Duration

**Description**: Time elapsed from import start to completion  
**Source**: `sync_logs.endTime - sync_logs.startTime`  
**Query**:

```sql
SELECT
  id,
  type,
  status,
  EXTRACT(EPOCH FROM (COALESCE("endTime", NOW()) - "startTime"))/3600 as hours,
  "recordsProcessed"
FROM sync_logs
WHERE type = 'FULL'
ORDER BY "startTime" DESC
LIMIT 10;
```

**Alert Thresholds**:

- ⚠️ **Warning**: >6 hours (150% of expected 4 hours)
- 🚨 **Critical**: >10 hours (approaching 12-hour timeout)

**Action**:

- Warning: Monitor closely, check for rate limit throttling
- Critical: Review import phases, consider cancellation and optimization

---

#### 2. Validation Rate

**Description**: Percentage of records passing validation (target: ≥98%)  
**Source**: `sync_status.validationRate`  
**Query**:

```sql
SELECT
  "validationRate",
  "totalRecordsProcessed",
  "validRecords",
  "invalidRecords",
  "updatedAt"
FROM sync_status
WHERE id = 'current';
```

**Alert Thresholds**:

- ⚠️ **Warning**: <98% validation rate
- 🚨 **Critical**: <95% validation rate

**Action**:

- Warning: Review SyncLog.errors for patterns, may indicate gomafia.pro schema changes
- Critical: Stop import, investigate validation failures, update Zod schemas if needed

---

#### 3. Import Progress Stall

**Description**: Import progress not updating (indicates stuck/hung state)  
**Source**: `sync_status.updatedAt` and `sync_status.progress`  
**Query**:

```sql
SELECT
  "isRunning",
  "progress",
  "currentOperation",
  NOW() - "updatedAt" as minutes_since_update
FROM sync_status
WHERE id = 'current'
AND "isRunning" = true
AND NOW() - "updatedAt" > interval '10 minutes';
```

**Alert Thresholds**:

- ⚠️ **Warning**: No update in 10 minutes
- 🚨 **Critical**: No update in 30 minutes

**Action**:

- Warning: Check application logs for errors, verify network connectivity to gomafia.pro
- Critical: Cancel import via API, check advisory lock status, review checkpoint for resume

---

#### 4. Import Errors

**Description**: Errors encountered during import phases  
**Source**: `sync_logs.errors` (JSON field)  
**Query**:

```sql
SELECT
  id,
  type,
  status,
  "startTime",
  errors
FROM sync_logs
WHERE type = 'FULL'
AND status = 'FAILED'
ORDER BY "startTime" DESC
LIMIT 5;
```

**Alert Thresholds**:

- ⚠️ **Warning**: Any FAILED status
- 🚨 **Critical**: 3+ consecutive FAILED imports

**Action**:

- Warning: Review error details, check for transient network issues
- Critical: Investigate root cause, may require code fix or gomafia.pro API changes

---

#### 5. Database Connection Pool Usage

**Description**: Active Prisma client connections  
**Source**: PostgreSQL `pg_stat_activity`  
**Query**:

```sql
SELECT
  datname,
  count(*) as active_connections,
  max_val.setting as max_connections
FROM pg_stat_activity
CROSS JOIN (SELECT setting FROM pg_settings WHERE name = 'max_connections') max_val
WHERE datname = 'mafia_insight'
GROUP BY datname, max_val.setting;
```

**Alert Thresholds**:

- ⚠️ **Warning**: >80% of max_connections
- 🚨 **Critical**: >95% of max_connections

**Action**:

- Warning: Review connection pool settings, check for connection leaks
- Critical: Scale database vertically or reduce connection_limit per instance

---

#### 6. Advisory Lock Status

**Description**: Import advisory lock held for extended period  
**Source**: PostgreSQL `pg_locks`  
**Query**:

```sql
SELECT
  locktype,
  objid,
  pid,
  granted,
  pg_blocking_pids(pid) as blocking_pids
FROM pg_locks
WHERE locktype = 'advisory'
AND objid = 123456789;  -- IMPORT_LOCK_ID
```

**Alert Thresholds**:

- ⚠️ **Warning**: Lock held >8 hours
- 🚨 **Critical**: Lock held >12 hours (timeout threshold)

**Action**:

- Warning: Monitor import progress, verify not stuck
- Critical: Force release lock via `pg_advisory_unlock_all()`, investigate import timeout

---

#### 7. Rate Limit Violations

**Description**: HTTP 429 responses from gomafia.pro  
**Source**: Application logs, RateLimiter metrics  
**Detection**: Log analysis for "rate limit" or "429" errors

**Alert Thresholds**:

- ⚠️ **Warning**: Any 429 response
- 🚨 **Critical**: >10 rate limit errors in 1 hour

**Action**:

- Warning: Verify RateLimiter delay (should be 2000ms), check for concurrent scraping
- Critical: Increase delay between requests, contact gomafia.pro if issue persists

---

#### 8. Memory Usage

**Description**: Application memory consumption during import  
**Source**: Application monitoring (Vercel/Datadog/New Relic)

**Alert Thresholds**:

- ⚠️ **Warning**: >70% of available memory
- 🚨 **Critical**: >90% of available memory or OOM errors

**Action**:

- Warning: Review batch size (should be 100), check for memory leaks
- Critical: Reduce batch size, optimize data structures, scale vertically

---

#### 9. Database Disk Usage

**Description**: PostgreSQL storage space  
**Query**:

```sql
SELECT
  pg_size_pretty(pg_database_size('mafia_insight')) as db_size,
  pg_size_pretty(pg_total_relation_size('players')) as players_size,
  pg_size_pretty(pg_total_relation_size('games')) as games_size,
  pg_size_pretty(pg_total_relation_size('player_year_stats')) as year_stats_size;
```

**Alert Thresholds**:

- ⚠️ **Warning**: >80% of provisioned storage
- 🚨 **Critical**: >95% of provisioned storage

**Action**:

- Warning: Plan for storage expansion
- Critical: Increase database storage, consider archiving old data

---

## Alert Implementation

### 1. Sentry Error Tracking

**Setup**:

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Tag import-related errors
    if (event.tags?.feature === 'import') {
      event.tags.priority = 'high';
    }
    return event;
  },
});

// In import code
try {
  await importOrchestrator.start();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'import', phase: 'orchestrator' },
    contexts: { import: { syncLogId, progress } },
  });
}
```

**Alert Rules**:

- Create Sentry alert for errors with tag `feature:import`
- Notify via email/Slack when >5 import errors in 1 hour
- Escalate to on-call if >20 import errors in 1 hour

---

### 2. Database Monitoring Alerts

**PostgreSQL Log Monitoring**:

```sql
-- Create monitoring view
CREATE VIEW import_health_check AS
SELECT
  ss."isRunning",
  ss.progress,
  ss."validationRate",
  EXTRACT(EPOCH FROM (NOW() - ss."updatedAt"))/60 as minutes_since_update,
  sl.status as last_sync_status,
  sl."recordsProcessed" as last_sync_records,
  sl.errors as last_sync_errors
FROM sync_status ss
LEFT JOIN LATERAL (
  SELECT * FROM sync_logs
  WHERE type = 'FULL'
  ORDER BY "startTime" DESC
  LIMIT 1
) sl ON true
WHERE ss.id = 'current';

-- Query periodically (every 5 minutes)
SELECT * FROM import_health_check;
```

**Automated Checks** (cron job or monitoring service):

```bash
#!/bin/bash
# Check import health every 5 minutes
# Add to crontab: */5 * * * * /path/to/check-import-health.sh

RESULT=$(psql $DATABASE_URL -t -c "SELECT
  CASE
    WHEN minutes_since_update > 30 THEN 'STALLED'
    WHEN \"validationRate\" < 0.95 THEN 'LOW_QUALITY'
    WHEN progress IS NULL AND \"isRunning\" = true THEN 'STUCK'
    ELSE 'OK'
  END as status
FROM import_health_check;")

if [[ "$RESULT" != "OK" ]]; then
  # Send alert via webhook or email
  curl -X POST $ALERT_WEBHOOK_URL \
    -H "Content-Type: application/json" \
    -d "{\"status\": \"$RESULT\", \"timestamp\": \"$(date -Iseconds)\"}"
fi
```

---

### 3. Application Log Alerts

**Key Log Patterns to Monitor**:

| Pattern                            | Severity | Action                             |
| ---------------------------------- | -------- | ---------------------------------- |
| `Import timeout exceeded`          | Critical | Cancel and investigate             |
| `Advisory lock acquisition failed` | Warning  | Check for stuck imports            |
| `Rate limit exceeded`              | Warning  | Verify delay enforcement           |
| `Validation failed for`            | Info     | Monitor trend, >2% requires action |
| `Checkpoint saved`                 | Info     | Import progressing normally        |
| `Import completed successfully`    | Info     | Celebrate! 🎉                      |

**Log Aggregation Query** (e.g., CloudWatch Insights):

```
fields @timestamp, @message
| filter @message like /import/i
| filter @message like /error|timeout|failed/i
| stats count() by bin(5m)
```

---

### 4. Uptime Monitoring

**Endpoints to Monitor**:

1. **Health Check**: `GET /api/health`
   - Expected: 200 OK
   - Frequency: Every 1 minute

2. **Import Status**: `GET /api/gomafia-sync/sync/status`
   - Expected: 200 OK with JSON response
   - Frequency: Every 5 minutes

3. **Check Empty**: `GET /api/gomafia-sync/import/check-empty`
   - Expected: 200 OK
   - Frequency: Every 10 minutes

**UptimeRobot Configuration**:

- Alert on 3+ consecutive failures
- Notify via email + Slack
- Monitor from multiple regions

---

## Alert Notification Channels

### Severity Levels

1. **Info**: Log only, no notification
2. **Warning**: Email to team, Slack #alerts channel
3. **Critical**: Email + SMS to on-call engineer, Slack #incidents channel

### Escalation Policy

```
Import Error → Warning Alert → Team Email (5 min)
                    ↓
            No Response → Critical Alert → On-Call SMS (15 min)
                    ↓
            No Resolution → Escalate to Engineering Lead (30 min)
```

### Contact List

- **Team Email**: eng-team@mafia-insight.com
- **On-Call Engineer**: oncall@mafia-insight.com
- **Engineering Lead**: lead@mafia-insight.com
- **Slack Channels**: #alerts, #incidents

---

## Dashboard Recommendations

### Import Operations Dashboard

**Metrics to Display**:

1. Current import status (running/idle/failed)
2. Progress percentage with ETA
3. Validation rate trend (last 7 days)
4. Import duration trend (last 10 imports)
5. Error rate by phase (clubs, players, games, etc.)
6. Database connection pool usage
7. Memory usage during import
8. Rate limit events timeline

**Tools**:

- Grafana with PostgreSQL data source
- Supabase Dashboard
- Custom Next.js admin dashboard at `/admin/monitoring`

---

## Runbooks

### Runbook 1: Import Timeout

**Symptoms**: Import running >12 hours  
**Investigation**:

1. Check current phase in `sync_status.currentOperation`
2. Review recent errors in `sync_logs.errors`
3. Check gomafia.pro availability: `curl -I https://gomafia.pro`
4. Verify rate limiter not causing excessive delays

**Resolution**:

```bash
# Cancel import
curl -X DELETE https://your-domain.com/api/gomafia-sync/import

# Check checkpoint
psql -c "SELECT \"currentOperation\" FROM sync_status WHERE id='current';"

# Resume with optimization if needed
curl -X POST https://your-domain.com/api/gomafia-sync/import?resume=true
```

---

### Runbook 2: Low Validation Rate

**Symptoms**: validationRate <98%  
**Investigation**:

1. Query invalid records: `SELECT errors FROM sync_logs WHERE status='FAILED' ORDER BY "startTime" DESC LIMIT 5;`
2. Check for patterns (e.g., specific entity types failing)
3. Visit gomafia.pro manually to verify page structure

**Resolution**:

1. Update Zod validators in `src/lib/gomafia/validators/` if schema changed
2. Redeploy application
3. Re-run import: `curl -X POST https://your-domain.com/api/gomafia-sync/import`

---

### Runbook 3: Advisory Lock Stuck

**Symptoms**: Cannot start new import, lock appears held  
**Investigation**:

```sql
-- Check if import is actually running
SELECT * FROM sync_status WHERE id='current' AND "isRunning"=true;

-- Check advisory lock
SELECT * FROM pg_locks WHERE locktype='advisory' AND objid=123456789;

-- Check process holding lock
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE pid IN (SELECT pid FROM pg_locks WHERE locktype='advisory' AND objid=123456789);
```

**Resolution**:

```sql
-- If import truly stuck, force unlock (use with caution)
SELECT pg_advisory_unlock_all();

-- Update sync status
UPDATE sync_status SET "isRunning"=false WHERE id='current';
```

---

## Maintenance

### Weekly

- [ ] Review import duration trends
- [ ] Analyze validation rate patterns
- [ ] Check for repeated errors
- [ ] Verify backup success

### Monthly

- [ ] Review and update alert thresholds
- [ ] Analyze import performance trends
- [ ] Optimize slow database queries
- [ ] Test runbooks with team

### Quarterly

- [ ] Review and update runbooks
- [ ] Conduct alert fatigue assessment
- [ ] Optimize monitoring dashboard
- [ ] Load test import with 10x data

---

**Last Updated**: October 26, 2025  
**Owner**: Engineering Team  
**Reviewers**: DevOps, Database Admin  
**Next Review**: November 26, 2025
