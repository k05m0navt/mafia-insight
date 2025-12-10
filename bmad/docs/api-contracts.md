# API Contracts Documentation

## API Overview

The application uses **Next.js API Routes** (App Router) for backend functionality. All API endpoints are located in `src/app/api/` and follow RESTful conventions.

**Base URL**: `/api`

**Authentication**: Most endpoints require authentication via `authenticateRequest()` middleware. Admin endpoints require `admin` role.

**Error Handling**: Standardized error responses with error codes and messages.

---

## Authentication Endpoints

### POST /api/auth/login

**Description**: User login endpoint

**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "user": { ... },
  "token": "string"
}
```

**Errors**: `401 Unauthorized`, `400 Bad Request`

---

### POST /api/auth/signup

**Description**: User registration endpoint

**Request Body**:

```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "user": { ... }
}
```

**Errors**: `400 Bad Request`, `409 Conflict`

---

### POST /api/auth/logout

**Description**: User logout endpoint

**Response**: `200 OK`

```json
{
  "success": true
}
```

---

### GET /api/auth/me

**Description**: Get current authenticated user

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "role": "user" | "admin" | "moderator",
    ...
  }
}
```

**Errors**: `401 Unauthorized`

---

### POST /api/auth/refresh

**Description**: Refresh authentication token

**Response**: `200 OK`

```json
{
  "success": true,
  "token": "string"
}
```

---

### GET /api/auth/permissions

**Description**: Get user permissions

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "permissions": ["string"]
}
```

---

### GET /api/auth/[...nextauth]

**Description**: NextAuth.js handler endpoint (OAuth, session management)

**Methods**: GET, POST

---

## Players Endpoints

### GET /api/players

**Description**: List players with pagination and filtering

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string, optional) - Search by player name
- `syncStatus` (enum: SYNCED | PENDING | ERROR, optional)
- `clubId` (UUID, optional)
- `sortBy` (enum: name | eloRating | totalGames | wins | losses | lastSyncAt, default: lastSyncAt)
- `sortOrder` (enum: asc | desc, default: desc)

**Response**: `200 OK`

```json
{
  "players": [
    {
      "id": "string",
      "gomafiaId": "string",
      "name": "string",
      "eloRating": number,
      "totalGames": number,
      "wins": number,
      "losses": number,
      "lastSyncAt": "ISO8601",
      "syncStatus": "SYNCED" | "PENDING" | "ERROR"
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

**Cache**: `public, s-maxage=30, stale-while-revalidate=60`

---

### GET /api/players/[id]

**Description**: Get specific player by ID

**Path Parameters**:

- `id` (UUID) - Player ID

**Authentication**: Required (users can only view their own profile unless admin)

**Response**: `200 OK`

```json
{
  "id": "string",
  "name": "string",
  "eloRating": number,
  ...
}
```

**Errors**: `403 Forbidden`, `404 Not Found`

---

### GET /api/players/[id]/analytics

**Description**: Get player analytics

**Path Parameters**:

- `id` (UUID) - Player ID

**Response**: `200 OK`

```json
{
  "analytics": { ... }
}
```

---

### GET /api/players/[id]/statistics

**Description**: Get player statistics

**Path Parameters**:

- `id` (UUID) - Player ID

**Response**: `200 OK`

```json
{
  "statistics": { ... }
}
```

---

## Games Endpoints

### GET /api/games

**Description**: List games with pagination and filtering

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string, optional) - Search by player name in participations
- `status` (enum: SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED, optional)
- `winnerTeam` (enum: BLACK | RED | DRAW, optional)
- `tournamentId` (UUID, optional)
- `startDate` (ISO8601, optional)
- `endDate` (ISO8601, optional)
- `sortBy` (enum: date | winnerTeam | status, default: date)
- `sortOrder` (enum: asc | desc, default: desc)

**Response**: `200 OK`

```json
{
  "games": [
    {
      "id": "string",
      "gomafiaId": "string",
      "date": "ISO8601",
      "winnerTeam": "BLACK" | "RED" | "DRAW",
      "status": "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
      "participations": [
        {
          "player": {
            "id": "string",
            "name": "string",
            "eloRating": number
          },
          "role": "DON" | "MAFIA" | "SHERIFF" | "CITIZEN",
          "team": "BLACK" | "RED",
          "isWinner": boolean
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

**Cache**: `public, s-maxage=30, stale-while-revalidate=60`

---

### GET /api/games/[id]

**Description**: Get specific game by ID

**Path Parameters**:

- `id` (UUID) - Game ID

**Response**: `200 OK`

```json
{
  "id": "string",
  "date": "ISO8601",
  "participations": [ ... ],
  ...
}
```

---

## Tournaments Endpoints

### GET /api/tournaments

**Description**: List tournaments with pagination and filtering

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)
- `status` (string, optional)
- `sortBy` (string, default: startDate)
- `sortOrder` (enum: asc | desc, default: desc)
- `minPrizePool` (number, optional)

**Response**: `200 OK`

```json
{
  "tournaments": [ ... ],
  "pagination": { ... }
}
```

**Cache**: `public, s-maxage=30, stale-while-revalidate=60`

---

### POST /api/tournaments

**Description**: Create new tournament

**Authentication**: Required

**Request Body**:

```json
{
  "userId": "string",
  "name": "string",
  "description": "string",
  "startDate": "ISO8601",
  ...
}
```

**Response**: `201 Created`

```json
{
  "id": "string",
  "name": "string",
  ...
}
```

---

### GET /api/tournaments/[id]

**Description**: Get specific tournament by ID

**Path Parameters**:

- `id` (UUID) - Tournament ID

**Response**: `200 OK`

---

### GET /api/tournaments/[id]/analytics

**Description**: Get tournament analytics

**Path Parameters**:

- `id` (UUID) - Tournament ID

**Response**: `200 OK`

---

## Clubs Endpoints

### GET /api/clubs

**Description**: List clubs with pagination and filtering

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)
- `sortBy` (string, default: createdAt)
- `sortOrder` (enum: asc | desc, default: desc)
- `minMembers` (number, optional)
- `region` (string, optional)

**Response**: `200 OK`

```json
{
  "clubs": [ ... ],
  "pagination": { ... }
}
```

**Cache**: `public, s-maxage=30, stale-while-revalidate=60`

---

### POST /api/clubs

**Description**: Create new club

**Authentication**: Required

**Request Body**:

```json
{
  "userId": "string",
  "name": "string",
  "description": "string",
  ...
}
```

**Response**: `201 Created`

---

### GET /api/clubs/[id]/analytics

**Description**: Get club analytics

**Path Parameters**:

- `id` (UUID) - Club ID

**Response**: `200 OK`

---

## Users Endpoints

### GET /api/users

**Description**: List users with pagination and filtering (Admin only)

**Authentication**: Required (Admin role)

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string, optional)
- `role` (enum: guest | user | admin, optional)

**Response**: `200 OK`

```json
{
  "users": [ ... ],
  "pagination": { ... }
}
```

**Errors**: `403 Forbidden` (non-admin)

---

### POST /api/users

**Description**: Create new user (Admin only)

**Authentication**: Required (Admin role)

**Request Body**:

```json
{
  "email": "string",
  "name": "string",
  "role": "guest" | "user" | "admin"
}
```

**Response**: `201 Created`

---

### GET /api/users/[id]

**Description**: Get specific user by ID

**Authentication**: Required (users can only view their own profile unless admin)

**Path Parameters**:

- `id` (UUID) - User ID

**Response**: `200 OK`

**Errors**: `403 Forbidden` (accessing other user's profile)

---

### PATCH /api/users/[id]

**Description**: Update user

**Authentication**: Required (users can only update their own profile unless admin)

**Path Parameters**:

- `id` (UUID) - User ID

**Request Body**:

```json
{
  "name": "string",
  "role": "guest" | "user" | "admin"
}
```

**Response**: `200 OK`

---

### PATCH /api/users/[id]/role

**Description**: Update user role (Admin only)

**Authentication**: Required (Admin role)

**Path Parameters**:

- `id` (UUID) - User ID

**Request Body**:

```json
{
  "role": "guest" | "user" | "admin"
}
```

**Response**: `200 OK`

---

### GET /api/users/invitations

**Description**: List user invitations (Admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "invitations": [ ... ]
}
```

---

## Admin Endpoints

### GET /api/admin/dashboard

**Description**: Get admin dashboard metrics

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "metrics": { ... }
}
```

**Errors**: `403 Forbidden` (non-admin)

---

### POST /api/admin/bootstrap

**Description**: Create first admin user (only works if no admins exist)

**Request Body**:

```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "confirmPassword": "string"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "message": "First admin user created successfully",
  "user": { ... }
}
```

**Errors**: `403 Forbidden` (admins already exist), `400 Bad Request` (validation)

---

### GET /api/admin/bootstrap/check

**Description**: Check if bootstrap is needed (no admins exist)

**Response**: `200 OK`

```json
{
  "needsBootstrap": boolean
}
```

---

### GET /api/admin/routes

**Description**: Get protected route configuration

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "routes": [
    {
      "path": "string",
      "methods": ["string"],
      "requiredRole": "ADMIN",
      "description": "string"
    }
  ],
  "total": number
}
```

---

### GET /api/admin/permissions

**Description**: Get permissions configuration

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "permissions": [ ... ]
}
```

---

### GET /api/admin/api-keys

**Description**: Get API keys (Admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "apiKeys": [ ... ],
  "total": number
}
```

---

### POST /api/admin/api-keys

**Description**: Create API key (Admin only)

**Authentication**: Required (Admin role)

**Response**: `201 Created`

---

### GET /api/admin/users

**Description**: Admin user management endpoint

**Authentication**: Required (Admin role)

**Response**: `200 OK`

---

### GET /api/admin/system-status

**Description**: Get system status

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "status": "string",
  "uptime": number,
  ...
}
```

---

### POST /api/admin/import/start

**Description**: Start data import (Admin only)

**Authentication**: Required (Admin role)

**Response**: `202 Accepted`

```json
{
  "success": true,
  "message": "Import started"
}
```

---

### POST /api/admin/import/stop

**Description**: Stop running import (Admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`

---

### POST /api/admin/import/clear-db

**Description**: Clear database (Admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`

---

### POST /api/admin/import/clear-data-type

**Description**: Clear specific data type (Admin only)

**Authentication**: Required (Admin role)

**Request Body**:

```json
{
  "dataType": "players" | "games" | "tournaments" | "clubs"
}
```

**Response**: `200 OK`

---

### GET /api/admin/import/skipped-pages

**Description**: Get skipped pages from import (Admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`

```json
{
  "skippedPages": [ ... ]
}
```

---

## GoMafia Sync Endpoints

### GET /api/gomafia-sync/import

**Description**: Get current import status with progress and metrics

**Response**: `200 OK`

```json
{
  "isRunning": boolean,
  "progress": number,
  "currentOperation": "string",
  "lastSyncTime": "ISO8601",
  "lastSyncType": "FULL" | "INCREMENTAL",
  "lastError": "string",
  "syncLogId": "string",
  "syncLogStatus": "string",
  "status": "RUNNING" | "COMPLETED" | "FAILED" | "PENDING",
  "processedRecords": number,
  "totalRecords": number,
  "validation": {
    "validationRate": number,
    "totalRecordsProcessed": number,
    "validRecords": number,
    "invalidRecords": number
  },
  "summary": {
    "players": number,
    "clubs": number,
    "games": number,
    "tournaments": number
  }
}
```

**Cache**: `no-store, no-cache, must-revalidate`

---

### POST /api/gomafia-sync/import

**Description**: Trigger initial data import from gomafia.pro

**Request Body** (optional):

```json
{
  "forceRestart": boolean
}
```

**Response**: `202 Accepted`

```json
{
  "success": true,
  "message": "Initial import started successfully",
  "syncLogId": "string",
  "estimatedDuration": "3-4 hours"
}
```

**Errors**: `409 Conflict` (import already running)

---

### DELETE /api/gomafia-sync/import

**Description**: Cancel running import gracefully

**Response**: `200 OK`

```json
{
  "success": true,
  "message": "Import cancellation requested. Saving checkpoint for resume capability."
}
```

**Errors**: `404 Not Found` (no import running)

---

### POST /api/gomafia-sync/import/pause

**Description**: Pause running import

**Response**: `200 OK`

---

### POST /api/gomafia-sync/import/resume

**Description**: Resume paused import

**Response**: `200 OK`

---

### POST /api/gomafia-sync/import/retry

**Description**: Retry failed import

**Response**: `200 OK`

---

### GET /api/gomafia-sync/import/check-empty

**Description**: Check if database is empty

**Response**: `200 OK`

```json
{
  "isEmpty": boolean
}
```

---

### GET /api/gomafia-sync/import/validation

**Description**: Get import validation metrics

**Response**: `200 OK`

```json
{
  "validation": { ... }
}
```

---

### POST /api/gomafia-sync/sync/trigger

**Description**: Trigger data synchronization

**Request Body**:

```json
{
  "type": "FULL" | "INCREMENTAL"
}
```

**Response**: `200 OK`

```json
{
  "success": true,
  "type": "FULL" | "INCREMENTAL",
  "message": "Sync triggered successfully",
  "syncLogId": "string"
}
```

**Errors**: `409 Conflict` (sync already running), `400 Bad Request` (invalid type)

---

### GET /api/gomafia-sync/sync/status

**Description**: Get sync status

**Response**: `200 OK`

```json
{
  "status": "string",
  "progress": number,
  ...
}
```

---

### GET /api/gomafia-sync/sync/logs

**Description**: Get sync logs

**Response**: `200 OK`

```json
{
  "logs": [ ... ]
}
```

---

### GET /api/gomafia-sync/sync/logs/[id]

**Description**: Get specific sync log

**Path Parameters**:

- `id` (UUID) - Sync log ID

**Response**: `200 OK`

---

### POST /api/gomafia-sync/manual-sync

**Description**: Trigger manual sync

**Response**: `200 OK`

---

### GET /api/gomafia-sync/integrity/verify

**Description**: Verify data integrity

**Response**: `200 OK`

```json
{
  "overallAccuracy": number,
  "entities": { ... },
  ...
}
```

---

### GET /api/gomafia-sync/integrity/reports

**Description**: Get data integrity reports

**Response**: `200 OK`

```json
{
  "reports": [ ... ]
}
```

---

## Import Progress Endpoints

### GET /api/import/progress

**Description**: Get import progress

**Response**: `200 OK`

```json
{
  "progress": number,
  "status": "string",
  ...
}
```

---

### GET /api/import/progress/stream

**Description**: Stream import progress (SSE)

**Response**: `200 OK` (Server-Sent Events stream)

---

## Analytics Endpoints

### GET /api/analytics/leaderboard

**Description**: Get leaderboard data

**Response**: `200 OK`

```json
{
  "leaderboard": [ ... ]
}
```

---

## Regions Endpoints

### GET /api/regions

**Description**: List regions

**Response**: `200 OK`

```json
{
  "regions": [ ... ]
}
```

---

### GET /api/regions/[regionCode]

**Description**: Get specific region

**Path Parameters**:

- `regionCode` (string) - Region code

**Response**: `200 OK`

---

## Search Endpoints

### GET /api/search/players

**Description**: Search players

**Query Parameters**:

- `q` (string) - Search query

**Response**: `200 OK`

```json
{
  "players": [ ... ]
}
```

---

## Navigation Endpoints

### GET /api/navigation/menu

**Description**: Get navigation menu based on user role

**Response**: `200 OK`

```json
{
  "items": [
    {
      "label": "string",
      "href": "string",
      "icon": "string",
      ...
    }
  ]
}
```

**Authentication**: Not required (GUEST access)

---

## Profile Endpoints

### GET /api/profile

**Description**: Get current user profile

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "user": { ... }
}
```

---

### PATCH /api/profile

**Description**: Update user profile

**Authentication**: Required

**Request Body**:

```json
{
  "name": "string",
  "avatar": "string",
  ...
}
```

**Response**: `200 OK`

---

### POST /api/profile/avatar

**Description**: Upload profile avatar

**Authentication**: Required

**Request**: Multipart form data

**Response**: `200 OK`

```json
{
  "avatarUrl": "string"
}
```

---

## Notifications Endpoints

### GET /api/notifications

**Description**: Get user notifications

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "notifications": [ ... ]
}
```

---

## Theme Endpoints

### GET /api/theme

**Description**: Get theme preference

**Authentication**: Required

**Response**: `200 OK`

```json
{
  "theme": "light" | "dark" | "system"
}
```

---

### POST /api/theme

**Description**: Update theme preference

**Authentication**: Required

**Request Body**:

```json
{
  "theme": "light" | "dark" | "system"
}
```

**Response**: `200 OK`

---

## Cron Endpoints

### GET /api/cron/daily-sync

**Description**: Trigger daily sync (cron job)

**Response**: `200 OK`

---

## Test Endpoints

### GET /api/test-db

**Description**: Test database connection (development only)

**Response**: `200 OK`

**Note**: Gated in production via `NODE_ENV` checks

---

### GET /api/test-players

**Description**: Test players endpoint (development only)

**Response**: `200 OK`

**Note**: Gated in production

---

### GET /api/test-players/[id]/analytics

**Description**: Test player analytics (development only)

**Path Parameters**:

- `id` (UUID) - Player ID

**Response**: `200 OK`

**Note**: Gated in production

---

## Error Response Format

All endpoints return standardized error responses:

```json
{
  "error": "string",
  "code": "ERROR_CODE",
  "message": "string",
  "details": { ... }
}
```

**Common Error Codes**:

- `AUTHENTICATION_ERROR` - 401
- `AUTHORIZATION_ERROR` - 403
- `VALIDATION_ERROR` - 400
- `NOT_FOUND` - 404
- `INTERNAL_ERROR` - 500
- `IMPORT_RUNNING` - 409
- `NO_IMPORT_RUNNING` - 404

---

## Authentication & Authorization

### Authentication Methods

1. **Cookie-based**: `auth-token` cookie set by login endpoint
2. **NextAuth.js**: OAuth providers (Google, Discord, GitHub)
3. **Session**: Server-side session management

### Authorization Levels

- **GUEST**: Public access (no authentication)
- **USER**: Authenticated users
- **ADMIN**: Administrative access
- **MODERATOR**: Moderator access

### Middleware

- `authenticateRequest()` - Validates authentication
- `requireRole(role)` - Enforces role requirements
- `withAdminAuth()` - Admin-only wrapper

---

## Rate Limiting

Rate limiting is implemented via Redis-based rate limiter:

- API endpoints: Configurable per endpoint
- Import endpoints: Stricter limits
- Auth endpoints: Standard limits

---

## Caching Strategy

**Public Endpoints** (Players, Games, Tournaments, Clubs):

- Cache-Control: `public, s-maxage=30, stale-while-revalidate=60`
- 30-second cache, 60-second stale-while-revalidate

**Dynamic Endpoints** (Import status, User data):

- Cache-Control: `no-store, no-cache, must-revalidate`
- No caching for real-time data

---

## API Versioning

Currently no versioning in URL path. Future versioning strategy:

- `/api/v1/...` for versioned endpoints
- Backward compatibility maintained

Generated: 2025-11-22T17:39:05.300Z
