# API Contracts: Fix Navbar UI and Authentication Errors

## Overview

This document specifies the API contracts for authentication-related endpoints that must function correctly after fixes. These are existing endpoints that need to handle authentication state properly.

## Authentication Endpoints

### POST /api/auth/login

**Purpose**: Authenticate user and establish session

**Request**:

```typescript
POST /api/auth/login
Content-Type: application/json

{
  email: string;
  password: string;
}
```

**Success Response** (200):

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    avatar?: string;
  };
  token: string;
  expiresAt: Date;
  message: string;
}
```

**Error Response** (401):

```typescript
{
  success: false;
  error: string; // Error message
}
```

**Response Headers**:

- `Set-Cookie: auth-token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=<seconds>`
- `Set-Cookie: user-role=<role>; Secure; SameSite=Strict; Max-Age=<seconds>`

**Contract Requirements**:

- MUST set `auth-token` cookie on successful login
- MUST return user object with role information
- MUST return token and expiration date
- Token MUST be valid for at least 24 hours

**Current Issues to Fix**:

- Cookie may not be set properly in all scenarios
- Response may not include all required user fields

---

### GET /api/auth/current

**Purpose**: Get current authenticated user (may need to be added if missing)

**Request**:

```typescript
GET /api/auth/current
Cookie: auth-token=<token>
```

**Success Response** (200):

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    avatar?: string;
  };
}
```

**Error Response** (401):

```typescript
{
  success: false;
  error: 'Authentication required';
  code: 'AUTHENTICATION_ERROR';
}
```

**Contract Requirements**:

- MUST validate `auth-token` cookie
- MUST return user object if authenticated
- MUST return 401 if token invalid or missing

---

### POST /api/auth/refresh

**Purpose**: Refresh expired session token

**Request**:

```typescript
POST /api/auth/refresh
Cookie: auth-token=<expired-token>
```

**Success Response** (200):

```typescript
{
  success: true;
  token: string;
  expiresAt: Date;
  message: 'Session refreshed';
}
```

**Error Response** (401):

```typescript
{
  success: false;
  error: 'Session refresh failed';
  code: 'SESSION_EXPIRED';
}
```

**Contract Requirements**:

- MUST validate refresh token if separate from auth token
- MUST set new `auth-token` cookie on success
- MUST return new expiration date

**Note**: This endpoint may need to be created if session refresh functionality doesn't exist.

---

### POST /api/auth/logout

**Purpose**: End user session

**Request**:

```typescript
POST /api/auth/logout
Cookie: auth-token=<token>
```

**Success Response** (200):

```typescript
{
  success: true;
  message: 'Logged out successfully';
}
```

**Response Headers**:

- `Set-Cookie: auth-token=; Max-Age=0` (clear cookie)
- `Set-Cookie: user-role=; Max-Age=0` (clear cookie)

**Contract Requirements**:

- MUST clear `auth-token` cookie
- MUST clear `user-role` cookie
- MUST invalidate session server-side

---

## Protected API Endpoints

### GET /api/import/progress

**Purpose**: Get current import progress (has authentication errors - FR-003)

**Request**:

```typescript
GET /api/import/progress
Cookie: auth-token=<token>
```

**Success Response** (200):

```typescript
{
  progress: {
    id: string;
    operation: string;
    progress: number;
    totalRecords: number;
    processedRecords: number;
    errors: number;
    startTime: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    estimatedCompletion?: string;
  };
}
```

**Error Response** (401):

```typescript
{
  error: 'Authentication required';
  message: 'Please sign in to view import progress';
  code: 'AUTHENTICATION_ERROR';
}
```

**Contract Requirements**:

- MUST validate `auth-token` cookie
- MUST return 401 with proper error format if not authenticated
- MUST NOT return authentication errors for authenticated users

**Current Issues to Fix**:

- May return authentication errors even when user is authenticated
- Cookie validation may be inconsistent

---

### POST /api/import/progress

**Purpose**: Start new import operation

**Request**:

```typescript
POST /api/import/progress
Cookie: auth-token=<token>
Content-Type: application/json

{
  operation: string;
  totalRecords: number;
}
```

**Success Response** (201):

```typescript
{
  id: string;
  operation: string;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  errors: number;
  startTime: string;
  status: 'PENDING' | 'RUNNING';
}
```

**Error Response** (401):

```typescript
{
  error: 'Authentication required';
  message: 'Please sign in to start import';
  code: 'AUTHENTICATION_ERROR';
}
```

**Contract Requirements**:

- MUST validate `auth-token` cookie
- MUST require authentication
- MUST return consistent error format

---

## Error Response Standard

All authentication errors MUST follow this format:

```typescript
{
  error: string;           // Short error identifier
  message: string;          // Human-readable message
  code?: string;           // Error code (e.g., 'AUTHENTICATION_ERROR')
  details?: any;           // Additional error details (optional)
}
```

**Error Codes**:

- `AUTHENTICATION_ERROR`: Authentication required or failed
- `SESSION_EXPIRED`: Session has expired
- `TOKEN_INVALID`: Token is invalid or malformed
- `AUTHORIZATION_ERROR`: User lacks required permissions (different from auth)

---

## Cookie Requirements

### auth-token Cookie

**Purpose**: Authentication token for API requests and SSR

**Attributes**:

- Name: `auth-token`
- Value: JWT or session token string
- HttpOnly: Recommended (but may not be set if client-side access needed)
- Secure: Yes (HTTPS only)
- SameSite: `Strict` or `Lax`
- Max-Age: Token expiration time in seconds
- Path: `/`

**Validation**:

- MUST be present in all protected API requests
- MUST be validated on every request
- MUST match localStorage `auth-token` value (client-side sync)

### user-role Cookie

**Purpose**: Quick role lookup without full user query

**Attributes**:

- Name: `user-role`
- Value: Role string (`'admin' | 'user' | 'guest'`)
- HttpOnly: No (client-side access needed)
- Secure: Yes (HTTPS only)
- SameSite: `Strict` or `Lax`
- Max-Age: Same as auth-token
- Path: `/`

**Validation**:

- MUST match user.role from authenticated user
- MUST be cleared on logout
- Can be used for quick permission checks

---

## State Synchronization Requirements

### Client-Server State Sync

1. **On Login**: Server sets cookies, client updates localStorage
2. **On Logout**: Server clears cookies, client clears localStorage
3. **On Refresh**: Server validates token, updates cookies if needed
4. **On API Request**: Client sends cookie, server validates and returns user info if needed

### Cross-Tab Synchronization

- Cookies are automatically shared across tabs (same origin)
- localStorage changes trigger StorageEvent in other tabs
- Client-side code listens for storage events and re-initializes auth state

---

## Testing Requirements

All endpoints MUST:

1. Return correct status codes
2. Set/clear cookies appropriately
3. Validate authentication consistently
4. Return consistent error formats
5. Not leak sensitive information in error messages
