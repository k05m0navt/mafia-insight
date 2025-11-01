# Data Model: Fix Navbar UI and Authentication Errors

## Overview

This feature does not introduce new data entities. Instead, it fixes synchronization issues with existing authentication state data structures. This document describes the authentication state model and how state flows through the system.

## Authentication State Model

### AuthState (Client-Side State)

**Location**: `src/hooks/useAuth.ts`, `src/types/auth.ts`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Fields**:

- `user`: Current authenticated user object or null if not authenticated
- `isAuthenticated`: Boolean flag indicating authentication status (derived from user presence)
- `isLoading`: Loading state during auth operations
- `error`: Error message if authentication fails

**State Transitions**:

1. **Unauthenticated → Loading**: When login/register initiated
2. **Loading → Authenticated**: On successful authentication
3. **Loading → Unauthenticated**: On authentication failure
4. **Authenticated → Unauthenticated**: On logout or session expiry
5. **Any → Error**: On authentication errors (transient)

### User Entity

**Location**: `src/services/AuthService.ts`, `src/types/auth.ts`

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  permissions?: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Attributes**:

- `id`: Unique user identifier
- `email`: User email (required)
- `name`: User display name (required)
- `role`: User role affecting permissions and UI visibility
- `permissions`: Array of permission strings (optional, role-based)

### Session State

**Location**: `src/hooks/useSession.ts`

```typescript
interface Session {
  user: User | null;
  token: string | null;
  expiresAt: Date | null;
  isValid: boolean;
}
```

**Fields**:

- `token`: Authentication token (stored in cookie and localStorage)
- `expiresAt`: Token expiration timestamp
- `isValid`: Computed validity based on expiration and token presence

**State Transitions**:

1. **Invalid → Valid**: On successful authentication
2. **Valid → Needs Refresh**: When within 1 hour of expiry
3. **Valid → Expired**: When past expiration time
4. **Any → Invalid**: On logout or token removal

## Data Storage

### Cookie Storage (Server-Side / SSR)

**Cookie Name**: `auth-token`
**Purpose**: Server-side authentication, API route access, SSR page rendering
**Scope**: HttpOnly recommended for security (current implementation may vary)
**Validation**: Checked by Next.js middleware (`src/proxy.ts`) and API routes

### LocalStorage (Client-Side)

**Key**: `auth-token`
**Purpose**: Client-side access to token, cross-tab synchronization
**Scope**: Same-origin, persistent across sessions
**Validation**: Used by `AuthService` for client-side operations

**Synchronization Requirement**: Cookie and localStorage MUST remain synchronized. Mismatches cause authentication state errors.

## State Synchronization Flow

### 1. Initial Authentication (Login)

```
User Login
  ↓
AuthService.login()
  ↓
API returns token
  ↓
Set cookie (auth-token)
  ↓
Set localStorage (auth-token)
  ↓
Dispatch 'auth-change' event
  ↓
useAuth hook re-initializes
  ↓
Navbar receives updated state
  ↓
Navbar displays user icon
```

### 2. Page Load / Navigation

```
Page Load / Navigation
  ↓
useAuth useEffect runs
  ↓
Check cookie AND localStorage
  ↓
Sync if mismatched (cookie wins)
  ↓
Get user from AuthService
  ↓
Update AuthState
  ↓
Components re-render with correct state
```

### 3. Cross-Tab Synchronization

```
Tab A: User logs in
  ↓
localStorage.setItem('auth-token', token)
  ↓
StorageEvent fired in Tab B
  ↓
Tab B detects storage change
  ↓
Dispatch 'auth-change' event
  ↓
useAuth hook in Tab B re-initializes
  ↓
Navbar in Tab B updates to show user icon
```

### 4. Session Expiry

```
Session expires detected
  ↓
Show toast notification with refresh option
  ↓
User clicks refresh OR auto-attempt refresh
  ↓
Refresh session via API
  ↓
Success: Update token, maintain session
  ↓
Failure: Clear auth state, redirect to login
```

## Validation Rules

### Authentication State Validation

1. **Cookie/LocalStorage Sync**: Must be synchronized; if mismatch detected, cookie takes precedence
2. **Token Validity**: Token must not be expired (checked against `expiresAt`)
3. **User Object**: If `isAuthenticated === true`, `user` must not be null
4. **Loading State**: `isLoading` must be false before rendering auth-dependent UI

### Navbar State Validation

1. **If `isAuthenticated === false`**: Show login/signup buttons
2. **If `isAuthenticated === true`**: Show user icon/profile dropdown
3. **If `isLoading === true`**: Show loading spinner
4. **State must update within 1 second** (SC-004 requirement)

## Relationships

### AuthState ↔ Navbar Component (One-to-One)

- Navbar consumes `useAuth()` hook
- Changes to `AuthState.isAuthenticated` trigger navbar UI updates
- Navbar renders `AuthControls` which reflects auth state

### AuthState ↔ All Protected Pages (One-to-Many)

- All protected pages consume authentication state
- State changes affect all pages simultaneously (via hooks)
- Pages must handle loading and error states

### Session ↔ API Requests (One-to-Many)

- Each API request includes `auth-token` cookie
- Session validity checked before API calls
- Failed auth on API returns 401, triggers state update

## Data Flow Constraints

1. **Source of Truth**: AuthService (`src/services/AuthService.ts`) is the source of truth for authentication state
2. **State Propagation**: State changes propagate via custom events (`auth-change`) and React hooks
3. **Persistence**: State persists across page refreshes via cookies and localStorage
4. **Synchronization Window**: State updates must be reflected in UI within 1 second (SC-004)

## Error States

### Authentication Errors (FR-007)

**Transient Errors** (show toast):

- Network failures during auth
- Session refresh failures
- Temporary API unavailability

**Persistent Errors** (show inline):

- Invalid credentials
- Token validation failures
- Authentication required but not provided

**Error Format**:

```typescript
{
  message: string;
  type: 'transient' | 'persistent';
  recoverable: boolean;
  action?: string; // e.g., 'refresh', 'login'
}
```
