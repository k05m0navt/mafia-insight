# Gomafia Data Synchronization

This document provides comprehensive information about the gomafia data synchronization system implemented in the Mafia Insight platform.

## Overview

The gomafia sync system automatically fetches and synchronizes player and game data from gomafia.pro using Playwright for browser automation. The system supports both full and incremental synchronization with comprehensive error handling, monitoring, and status management.

## Architecture

### Core Components

1. **Data Parser** (`src/lib/parsers/gomafiaParser.ts`)
   - Scrapes HTML pages from gomafia.pro using Playwright
   - Handles dynamic content interaction and JavaScript execution
   - Implements retry logic with exponential backoff
   - Parses player and game data from HTML structures

2. **Sync Job** (`src/lib/jobs/syncJob.ts`)
   - Orchestrates synchronization operations
   - Supports full and incremental sync modes
   - Implements batch processing for performance
   - Handles error recovery and logging

3. **Database Models**
   - `SyncLog` - Tracks synchronization operations
   - `SyncStatus` - Current sync state
   - Extended `Player` and `Game` models with sync tracking

4. **API Routes** (`src/app/api/gomafia-sync/`)
   - GET `/api/gomafia-sync/sync/status` - Get current sync status
   - POST `/api/gomafia-sync/sync/trigger` - Manually trigger sync
   - GET `/api/gomafia-sync/sync/logs` - Get sync logs
   - GET `/api/gomafia-sync/sync/logs/[id]` - Get specific log details

5. **UI Components** (`src/components/data-display/`)
   - Sync status indicator
   - Sync trigger button
   - Sync logs table
   - Live sync status updates

## Data Flow

### Full Sync Process

1. **Initialization**
   - Create sync log entry
   - Update sync status to "RUNNING"
   - Set progress to 0%

2. **Data Collection**
   - Fetch player list from gomafia.pro
   - Process players in batches (default: 100)
   - For each player, fetch detailed data
   - Parse and validate data

3. **Data Storage**
   - Transform data to internal format
   - Upsert records in database
   - Update sync tracking fields
   - Handle duplicates and conflicts

4. **Completion**
   - Update sync log with results
   - Set sync status to "COMPLETED"
   - Send notifications
   - Update metrics

### Incremental Sync Process

1. **Identification**
   - Find players with sync status "PENDING" or "ERROR"
   - Check for players not synced in last 24 hours
   - Limit to prevent system overload

2. **Update Process**
   - Fetch updated data for identified players
   - Compare with existing data
   - Update only changed records
   - Mark as "SYNCED" or "ERROR"

3. **Completion**
   - Update sync logs
   - Send notifications
   - Update metrics

## Error Handling

### Error Types

1. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - HTTP errors (4xx, 5xx)

2. **Parsing Errors**
   - Malformed HTML
   - Missing data fields
   - Invalid data formats

3. **Validation Errors**
   - Data type mismatches
   - Constraint violations
   - Business rule violations

4. **Database Errors**
   - Connection failures
   - Constraint violations
   - Transaction rollbacks

### Error Recovery

1. **Retry Logic**
   - Exponential backoff
   - Maximum retry attempts
   - Circuit breaker pattern

2. **Data Validation**
   - Schema validation with Zod
   - Business rule validation
   - Partial data handling

3. **Conflict Resolution**
   - Duplicate detection
   - Data conflict resolution
   - Manual intervention support

## Monitoring and Observability

### Metrics Collection

- **Sync Metrics**: Total syncs, success rate, error rate, duration
- **Performance Metrics**: Response time, memory usage, CPU usage
- **Database Metrics**: Record counts, connection pool status
- **Health Metrics**: System health status, recommendations

### Logging

- **Structured Logging**: JSON format with context
- **Log Levels**: Info, Warning, Error
- **Error Tracking**: Stack traces, error codes
- **Performance Logging**: Duration, resource usage

### Notifications

- **Sync Completion**: Success/failure notifications
- **Health Alerts**: Critical issues, warnings
- **Performance Alerts**: High error rates, long durations
- **Channels**: Database, webhook, email (configurable)

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Sync Configuration
GOMAFIA_BASE_URL=https://gomafia.pro
SYNC_BATCH_SIZE=100
SYNC_MAX_RETRIES=5
SYNC_RETRY_DELAY=1000

# Cron Schedule
SYNC_CRON_SCHEDULE="0 0 * * *"

# Redis Cache
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### Rate Limiting

- **Gomafia Requests**: 10 requests per minute
- **API Requests**: 100 requests per minute
- **Sync Operations**: 5 syncs per hour
- **Configurable**: Per-identifier limits

## API Reference

### Sync Status

```typescript
GET /api/gomafia-sync/sync/status

Response:
{
  status: {
    isRunning: boolean;
    progress: number;
    currentOperation: string | null;
    lastSyncTime: string | null;
    lastSyncType: string | null;
    lastError: string | null;
  };
  metrics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
    errorRate: number;
  };
  health: {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    message: string;
    recommendations: string[];
  };
}
```

### Trigger Sync

```typescript
POST /api/gomafia-sync/sync/trigger
Content-Type: application/json

{
  "type": "FULL" | "INCREMENTAL"
}

Response:
{
  success: boolean;
  type: string;
  message: string;
  syncLogId: string;
}
```

### Sync Logs

```typescript
GET /api/gomafia-sync/sync/logs?page=1&limit=20&status=COMPLETED&type=FULL

Response:
{
  logs: SyncLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

## Database Schema

### SyncLog

```sql
CREATE TABLE sync_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'FULL' | 'INCREMENTAL'
  status TEXT NOT NULL, -- 'RUNNING' | 'COMPLETED' | 'FAILED'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  records_processed INTEGER,
  errors JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### SyncStatus

```sql
CREATE TABLE sync_status (
  id TEXT PRIMARY KEY DEFAULT 'current',
  last_sync_time TIMESTAMP,
  last_sync_type TEXT,
  is_running BOOLEAN DEFAULT FALSE,
  progress INTEGER,
  current_operation TEXT,
  last_error TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Extended Player Model

```sql
ALTER TABLE players ADD COLUMN last_sync_at TIMESTAMP;
ALTER TABLE players ADD COLUMN sync_status TEXT;
```

### Extended Game Model

```sql
ALTER TABLE games ADD COLUMN last_sync_at TIMESTAMP;
ALTER TABLE games ADD COLUMN sync_status TEXT;
```

## Performance Optimization

### Database Indexes

- `idx_sync_logs_created_at` - Time-based queries
- `idx_sync_logs_status` - Status filtering
- `idx_players_last_sync_at` - Incremental sync queries
- `idx_players_sync_status` - Status filtering
- `idx_games_last_sync_at` - Incremental sync queries
- `idx_games_sync_status` - Status filtering

### Caching Strategy

- **Redis Cache**: Sync status, metrics, recent logs
- **TTL**: 5 minutes for status, 1 minute for logs
- **Invalidation**: On sync start/completion
- **Fallback**: Database queries if cache unavailable

### Batch Processing

- **Batch Size**: 100 records (configurable)
- **Transaction**: Batch operations in transactions
- **Progress Tracking**: Real-time progress updates
- **Resume Capability**: Continue from last successful batch

## Security Considerations

### Rate Limiting

- **Gomafia Requests**: Respect source website limits
- **API Requests**: Prevent abuse and DoS
- **Sync Operations**: Prevent resource exhaustion
- **Per-IP Limits**: Additional protection

### Data Validation

- **Input Validation**: All external data validated
- **Schema Validation**: Zod schemas for type safety
- **Business Rules**: Constraint validation
- **Sanitization**: HTML/script injection prevention

### Error Handling

- **Error Exposure**: Limited error information to clients
- **Logging**: Comprehensive error logging
- **Monitoring**: Real-time error tracking
- **Recovery**: Automatic retry and fallback

## Troubleshooting

### Common Issues

1. **Sync Stuck at 0%**
   - Check network connectivity
   - Verify gomafia.pro accessibility
   - Review browser automation logs

2. **High Error Rate**
   - Check rate limiting
   - Verify data format changes
   - Review error logs

3. **Memory Issues**
   - Reduce batch size
   - Check for memory leaks
   - Monitor resource usage

4. **Database Issues**
   - Check connection pool
   - Verify database performance
   - Review transaction logs

### Debugging

1. **Enable Debug Logging**

   ```env
   DEBUG=sync:*
   LOG_LEVEL=debug
   ```

2. **Check Sync Logs**

   ```sql
   SELECT * FROM sync_logs ORDER BY start_time DESC LIMIT 10;
   ```

3. **Monitor Performance**

   ```bash
   curl http://localhost:3000/api/gomafia-sync/sync/status
   ```

4. **Test Parser**
   ```typescript
   import { parsePlayer } from '@/lib/parsers/gomafiaParser';
   const player = await parsePlayer('player-id');
   ```

## Deployment

### Production Setup

1. **Environment Variables**
   - Set all required environment variables
   - Configure Redis connection
   - Set up database connection

2. **Cron Job Configuration**

   ```json
   {
     "crons": [
       {
         "path": "/api/gomafia-sync/sync/trigger",
         "schedule": "0 0 * * *"
       }
     ]
   }
   ```

3. **Monitoring Setup**
   - Configure error tracking (Sentry)
   - Set up performance monitoring
   - Configure alerting

4. **Database Migration**
   ```bash
   yarn db:migrate
   ```

### Health Checks

- **Sync Status**: `/api/gomafia-sync/sync/status`
- **Database**: Connection and query performance
- **Redis**: Cache availability and performance
- **External**: gomafia.pro accessibility

## Future Enhancements

### Planned Features

1. **Data Export**: Export synchronized data
2. **Real-time Updates**: WebSocket-based live updates
3. **Advanced Filtering**: Complex query capabilities
4. **Data Analytics**: Advanced reporting and insights
5. **Multi-source Sync**: Support for additional data sources

### Performance Improvements

1. **Parallel Processing**: Multi-threaded sync operations
2. **Incremental Updates**: Delta sync capabilities
3. **Caching**: Advanced caching strategies
4. **Optimization**: Query and processing optimization

## Support

For issues or questions:

1. Check sync logs in database
2. Review error messages in logs
3. Consult this documentation
4. Contact development team

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready
