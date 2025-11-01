# Research: Fix Navbar UI and Authentication Errors

## Authentication State Synchronization Patterns

### Decision: Use Zustand Store with Persistence Middleware

**Rationale**:

- Zustand store already exists (`src/store/authStore.ts`) with persist middleware
- Zustand's persist middleware automatically handles cross-tab synchronization via StorageEvent
- Built-in React reactivity - components automatically re-render on state changes
- Simpler than custom event system - no manual event listeners needed
- Consistent with existing codebase patterns (Zustand already used for analyticsStore)
- Persistence to localStorage handled automatically

**Alternatives Considered**:

- Custom event-based approach: Rejected - adds unnecessary complexity when Zustand exists
- Context-only approach: Rejected - doesn't handle cross-tab synchronization well
- Polling-based approach: Rejected - inefficient, adds unnecessary load
- Continue using useAuth hook: Rejected - hook doesn't provide cross-tab sync, Zustand store exists but unused

**Implementation Pattern**:

```typescript
// Use Zustand store directly in components
import {
  useAuthStore,
  useIsAuthenticated,
  useCurrentUser,
} from '@/store/authStore';

// Components automatically re-render when store updates
const isAuthenticated = useIsAuthenticated();
const user = useCurrentUser();

// Zustand persist middleware handles:
// - localStorage persistence
// - Cross-tab synchronization (via StorageEvent)
// - Automatic rehydration on page load
```

**Source**: Existing Zustand store in `src/store/authStore.ts`, Zustand documentation for persist middleware

---

## Cross-Tab Authentication State Synchronization

### Decision: Zustand Persist Middleware (Automatic Cross-Tab Sync)

**Rationale**:

- Zustand's `persist` middleware automatically handles cross-tab synchronization
- Uses StorageEvent API under the hood - native browser support
- No manual event listeners needed - handled transparently
- Automatic state rehydration when tabs sync
- Minimal overhead, reacts immediately to changes

**Alternatives Considered**:

- Manual StorageEvent listeners: Rejected - Zustand handles this automatically
- BroadcastChannel API: Rejected - Zustand persist is sufficient and simpler
- SharedWorker: Overkill for this use case
- Polling localStorage: Inefficient, adds latency

**Implementation Pattern**:

```typescript
// Zustand persist middleware automatically handles this:
// - Persists state to localStorage with key 'auth-store'
// - Listens for StorageEvent in other tabs
// - Automatically updates store when localStorage changes
// - Components using store automatically re-render

// No manual code needed - it's automatic!
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      /* store implementation */
    }),
    { name: 'auth-store' } // localStorage key
  )
);
```

**Source**: Zustand persist middleware documentation, existing authStore implementation

---

## Cookie-Based Authentication Token Validation

### Decision: Sync Zustand store with cookies on initialization, cookie as source of truth

**Rationale**:

- Cookies required for SSR/API routes (Next.js middleware)
- Zustand persist stores auth state in localStorage (not token directly)
- Must validate cookie and sync with Zustand store state on page load
- Cookie takes precedence as source of truth for authentication
- Zustand store syncs auth state, not raw tokens

**Alternatives Considered**:

- Cookie-only: Rejected - breaks client-side state management
- localStorage-only: Rejected - doesn't work with Next.js SSR
- Store tokens in Zustand: Rejected - tokens should be in cookies, store manages auth state

**Implementation Pattern**:

```typescript
// In authStore checkAuthStatus or initialization:
// 1. Check cookie for auth-token
// 2. Validate token with authService
// 3. If valid, sync Zustand store state
// 4. If invalid/missing, clear Zustand store state

checkAuthStatus: async () => {
  const cookieToken = getCookie('auth-token');
  if (!cookieToken || !authService.isAuthenticated()) {
    set({ isAuthenticated: false, user: null });
    return;
  }

  const user = await authService.getCurrentUser();
  set({ isAuthenticated: true, user });
};
```

**Source**: Next.js documentation, existing authStore.checkAuthStatus implementation

---

## Error Handling Patterns for Authentication Failures

### Decision: Toast notifications for transient errors, inline error states for persistent issues

**Rationale**:

- Matches clarification requirement (Q1: Toast/notification messages for transient errors)
- Provides immediate user feedback without blocking interaction
- Inline errors persist until resolved, providing better UX for recoverable errors
- Uses existing @radix-ui/react-toast component (already in dependencies)

**Alternatives Considered**:

- Modal dialogs only: Rejected - too intrusive for transient errors
- Console-only: Rejected - users don't see feedback
- Toast only: Partially accepted - but need inline for persistent errors

**Implementation Pattern**:

```typescript
// Transient error (e.g., session expired during action)
toast.error('Session expired. Refreshing...');

// Persistent error (e.g., auth check fails on page load)
<div className="error-state">
  <AlertCircle /> Authentication error. Please sign in again.
</div>
```

**Source**: Clarification Q1 answer, Radix UI Toast documentation

---

## Page Load and Navigation State Initialization

### Decision: Initialize Zustand store on mount, re-check on navigation, use Next.js router events

**Rationale**:

- Zustand persist automatically rehydrates from localStorage on mount
- Still need to validate cookie and sync with server state on page load
- Next.js router events provide reliable navigation hooks
- Combines with visibility change detection for tab focus scenarios
- Store already has `checkAuthStatus` method for this purpose

**Alternatives Considered**:

- Polling: Rejected - inefficient, adds latency
- Rely only on Zustand persist: Rejected - need to validate cookie on server-side
- Custom event system: Rejected - Zustand provides reactivity automatically

**Implementation Pattern**:

```typescript
// In component or layout:
useEffect(() => {
  // Zustand persist auto-rehydrates, but validate cookie too
  const { checkAuthStatus } = useAuthStore.getState();
  checkAuthStatus();

  // Re-check on navigation (App Router - use pathname change)
  // For App Router: useEffect with pathname dependency
  // For Pages Router: router.events.on('routeChangeComplete', checkAuthStatus);
}, [pathname]);
```

**Source**: Next.js router documentation, Zustand persist middleware, existing authStore implementation

---

## Session Expiry Handling UX Pattern

### Decision: Toast notification with refresh button, then redirect if refresh fails

**Rationale**:

- Matches clarification requirement (Q4: Show toast notification with option to refresh session)
- Non-blocking - user can continue working while notification shown
- Provides recovery path before forcing login
- Only redirects if refresh fails, maintaining good UX

**Alternatives Considered**:

- Immediate redirect: Rejected - too disruptive, loses user context
- Modal blocking: Rejected - interrupts workflow unnecessarily
- Silent background refresh: Partially accepted - but need user notification

**Implementation Pattern**:

```typescript
// On session expiry detection
toast.error('Session expired', {
  action: {
    label: 'Refresh',
    onClick: async () => {
      const result = await refreshSession();
      if (!result.success) {
        router.push('/login');
      }
    },
  },
});
```

**Source**: Clarification Q4 answer, existing `SessionExpiredModal` component patterns

---

## Summary

All research areas resolved with existing codebase patterns and clarification answers. No external research needed beyond:

1. Verifying existing event-based synchronization approach
2. Confirming cross-tab sync using StorageEvent API
3. Validating cookie + localStorage sync pattern
4. Implementing toast + inline error pattern per clarifications
5. Using existing Next.js router + visibility change hooks

No NEEDS CLARIFICATION items remain.
