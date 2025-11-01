# Admin API Documentation

This document describes the administrative API endpoints for system management, import controls, and database operations.

## Authentication

All admin endpoints require authentication and the `admin` role:

```http
Authorization: Bearer <admin-jwt-token>
```

## Dashboard Metrics

### GET /api/admin/dashboard

Fetch comprehensive dashboard metrics including data volumes, import status, system health, and recent activity.

**Response:**

```json
{
  "dataVolumes": {
    "totalPlayers": 1250,
    "totalGames": 8560,
    "totalTournaments": 342,
    "totalClubs": 28
  },
  "importStatus": {
    "isRunning": false,
    "progress": 100,
    "lastSyncTime": "2025-01-27T12:00:00Z",
    "lastSyncType": "FULL",
    "currentOperation": null,
    "lastError": null
  },
  "systemHealth": {
    "status": "healthy",
    "databaseConnected": true,
    "errorsLast24h": 0,
    "message": "All systems operational"
  },
  "recentActivity": {
    "imports": [
      {
        "id": "sync_log_123",
        "type": "FULL",
        "status": "COMPLETED",
        "startTime": "2025-01-27T10:00:00Z",
        "endTime": "2025-01-27T12:00:00Z",
        "recordsProcessed": 8560
      }
    ]
  }
}
```

**Status Codes:**

- `200 OK` - Dashboard metrics retrieved successfully
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Failed to fetch metrics

## Import Controls

### POST /api/admin/import/stop

Stop a running import operation with graceful shutdown and checkpoint preservation.

**Response:**

```json
{
  "success": true,
  "message": "Import stopped successfully"
}
```

**Status Codes:**

- `200 OK` - Import stopped successfully
- `400 Bad Request` - No import operation currently running
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Failed to stop import

**Error Response:**

```json
{
  "error": "No import operation currently running"
}
```

## Database Management

### POST /api/admin/import/clear-db

Clear all imported game data while preserving user accounts and system configuration.

**Request Body:**

```json
{
  "confirm": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Database cleared successfully",
  "deleted": {
    "gameParticipation": 12500,
    "playerYearStats": 890,
    "playerRoleStats": 1560,
    "playerTournament": 2340,
    "game": 8560,
    "tournament": 342,
    "player": 1250,
    "club": 28,
    "analytics": 156
  }
}
```

**Status Codes:**

- `200 OK` - Database cleared successfully
- `400 Bad Request` - Must confirm operation or import currently running
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Admin access required
- `500 Internal Server Error` - Failed to clear database

**Error Response:**

```json
{
  "error": "Cannot clear database while import is running"
}
```

## Tables Cleared

The database clear operation removes the following tables:

- `GameParticipation`
- `PlayerYearStats`
- `PlayerRoleStats`
- `PlayerTournament`
- `Game`
- `Tournament`
- `Player`
- `Club`
- `Analytics`

## Tables Preserved

The following system data is preserved:

- `User` (all accounts)
- `SyncLog` (audit history)
- `SyncStatus` (current status)
- `ImportCheckpoint` (resume capability)
- `ImportProgress` (history)
- `Region` (reference data)
- `Notification` (system operations)
- `DataIntegrityReport` (quality tracking)
- `EmailLog` (communication history)

## Rate Limiting

- **Dashboard metrics**: 20 requests per minute
- **Import controls**: 10 requests per minute
- **Database operations**: 2 requests per minute

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message description"
}
```

Common error scenarios:

| Status | Error                                           | Description                  |
| ------ | ----------------------------------------------- | ---------------------------- |
| 400    | `Must confirm database clear operation`         | Confirmation flag missing    |
| 400    | `Cannot clear database while import is running` | Import operation in progress |
| 400    | `No import operation currently running`         | No active import to stop     |
| 401    | `Authentication required`                       | Missing or invalid token     |
| 403    | `Admin access required`                         | User lacks admin role        |
| 500    | `Failed to fetch dashboard metrics`             | Server error                 |

## Usage Examples

### cURL

```bash
# Get dashboard metrics
curl -X GET https://mafiainsight.com/api/admin/dashboard \
  -H "Authorization: Bearer <admin-token>"

# Stop import
curl -X POST https://mafiainsight.com/api/admin/import/stop \
  -H "Authorization: Bearer <admin-token>"

# Clear database
curl -X POST https://mafiainsight.com/api/admin/import/clear-db \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"confirm": true}'
```

### JavaScript/TypeScript

```typescript
// Get dashboard metrics
const response = await fetch('/api/admin/dashboard', {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});
const metrics = await response.json();

// Stop import
const stopResponse = await fetch('/api/admin/import/stop', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});
const result = await stopResponse.json();

// Clear database
const clearResponse = await fetch('/api/admin/import/clear-db', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ confirm: true }),
});
const clearResult = await clearResponse.json();
```

## Changelog

### v1.0.0 (2025-01-27)

- Initial admin API release
- Dashboard metrics endpoint
- Import stop endpoint
- Database clear endpoint
