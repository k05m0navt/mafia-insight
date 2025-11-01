# Quickstart Guide: Fix Navbar UI and Authentication Errors

## Overview

This guide helps developers understand how to work with the authentication state synchronization fixes. The changes ensure the navbar correctly displays user authentication state and all pages handle authentication consistently.

## Key Concepts

### Authentication State Flow

1. **Login** → Server sets cookies → Zustand store updates → Persist middleware saves to localStorage → Components automatically re-render
2. **Page Load** → Zustand persist rehydrates from localStorage → `checkAuthStatus` validates cookie → Store syncs → Components render with correct state
3. **Navigation** → `checkAuthStatus` runs → Store updates if needed → Components automatically re-render
4. **Cross-Tab** → StorageEvent (automatic via Zustand persist) → Store updates → Components in all tabs re-render

### Components Involved

- **`useAuthStore`** (`src/store/authStore.ts`): Zustand store managing authentication state with persistence
- **`Navbar` component** (`src/components/navigation/Navbar.tsx`): Displays auth-dependent UI (needs migration to Zustand)
- **`AuthControls` component** (`src/components/navigation/AuthControls.tsx`): Renders login buttons or user menu (needs migration to Zustand)
- **`AuthService`** (`src/services/AuthService.ts`): Handles API calls, cookie management

## Development Workflow

### 1. Understanding the Issue

**Problem**: After login, navbar shows login/signup buttons instead of user icon.

**Root Cause**: Components using `useAuth` hook instead of existing Zustand store. Authentication state not synchronizing properly between:

- Server-side cookies (`auth-token`)
- Zustand store state (persisted in localStorage via persist middleware)
- React component state (components not using Zustand store)
- UI components (Navbar/AuthControls using wrong hook)

### 2. Migrating to Zustand Store

#### Step 1: Enhance Zustand Store Cookie Sync

**Location**: `src/store/authStore.ts`

**Issue**: Store's `checkAuthStatus` may not properly sync with cookies on initialization.

**Fix**:

```typescript
// Enhance checkAuthStatus to properly sync with cookies
checkAuthStatus: async () => {
  // Check cookie first (source of truth for SSR)
  const cookieToken = typeof document !== 'undefined'
    ? getCookie('auth-token')
    : null;

  if (!cookieToken || !authService.isAuthenticated()) {
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    return;
  }

  try {
    set({ isLoading: true });

    // Validate token and get user
    const user = await authService.getCurrentUser();
    const permissions = await authService.getPermissions();

    permissionService.setPermissions(permissions);

    // Update Zustand store - persist middleware handles localStorage sync
    // Components using store will automatically re-render
    set({
      isAuthenticated: true,
      user,
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.error('Auth check failed:', error);
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }
},
```

**Note**: Zustand persist middleware automatically handles:

- localStorage persistence (key: 'auth-store')
- Cross-tab synchronization (via StorageEvent)
- State rehydration on page load
- React component re-renders when state changes

### 3. Migrating Navbar Component to Zustand

**Location**: `src/components/navigation/Navbar.tsx`

**Issue**: Navbar uses `useAuth` hook instead of Zustand store.

**Fix**: Migrate to use Zustand selectors:

```typescript
import { useIsAuthenticated, useCurrentUser } from '@/store/authStore';

export function Navbar() {
  // Zustand selectors automatically cause re-render on state change
  const isAuthenticated = useIsAuthenticated();
  const user = useCurrentUser();

  // No event listeners needed - Zustand handles reactivity automatically!
  return (
    <nav>
      <AuthControls
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </nav>
  );
}
```

### 4. Initializing Store on Page Load

**Location**: Root layout or component that wraps app

**Issue**: Store needs to validate cookie on page load.

**Fix**: Call `checkAuthStatus` on mount:

```typescript
// In root layout or app component
useEffect(() => {
  const { checkAuthStatus } = useAuthStore.getState();
  checkAuthStatus();
}, []);

// On navigation (App Router)
useEffect(() => {
  const { checkAuthStatus } = useAuthStore.getState();
  checkAuthStatus();
}, [pathname]);
```

### 5. Fixing Import Page Authentication Errors

**Location**: `src/app/api/import/progress/route.ts`

**Issue**: May return authentication errors even when user is authenticated.

**Fix**: Ensure consistent cookie validation:

```typescript
export async function GET(request: NextRequest) {
  // Validate cookie consistently
  const authToken = request.cookies.get('auth-token')?.value;

  if (!authToken) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please sign in to view import progress',
        code: 'AUTHENTICATION_ERROR',
      },
      { status: 401 }
    );
  }

  // Validate token if needed (check expiration, format, etc.)
  // ... rest of handler
}
```

### 6. Adding Session Refresh Functionality

**Location**: `src/app/api/auth/refresh/route.ts` (may need to be created)

**Purpose**: Handle session expiry gracefully per clarification Q4.

**Implementation**:

```typescript
export async function POST(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;

  if (!authToken) {
    return NextResponse.json(
      {
        success: false,
        error: 'Session refresh failed',
        code: 'SESSION_EXPIRED',
      },
      { status: 401 }
    );
  }

  // Validate and refresh token
  // ... implementation

  // Set new cookie
  const response = NextResponse.json({
    success: true,
    token: newToken,
    expiresAt: newExpiresAt,
  });

  response.cookies.set('auth-token', newToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return response;
}
```

## Testing

### Unit Tests

**Test Zustand auth store**:

```typescript
import { useAuthStore } from '@/store/authStore';

describe('useAuthStore', () => {
  it('should update state when login succeeds', async () => {
    const { login } = useAuthStore.getState();
    await login('user@example.com', 'password');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toBeTruthy();
  });

  it('should sync with cookie on checkAuthStatus', async () => {
    // Set cookie
    document.cookie = 'auth-token=valid-token';

    const { checkAuthStatus } = useAuthStore.getState();
    await checkAuthStatus();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

### Component Tests

**Test Navbar auth state rendering**:

```typescript
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import { Navbar } from '@/components/navigation/Navbar';

describe('Navbar', () => {
  it('should show user icon when authenticated', () => {
    // Set store state
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'user@test.com', name: 'Test User' }
    });

    render(<Navbar />);
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
  });

  it('should show login buttons when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });

    render(<Navbar />);
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });
});
```

### Integration Tests

**Test complete auth flow**:

```typescript
describe('Authentication Flow', () => {
  it('should update navbar after login', async () => {
    // 1. Login user
    // 2. Verify navbar shows user icon
    // 3. Verify state is synchronized
  });
});
```

### E2E Tests

**Test full user journey**:

```typescript
test('user login updates navbar', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Wait for redirect and navbar update
  await page.waitForURL('/');
  await expect(page.locator('[data-testid="user-icon"]')).toBeVisible();
});
```

## Debugging

### Common Issues

1. **Navbar still shows login buttons after login**
   - Check: Is `auth-change` event being emitted?
   - Check: Is Navbar listening to the event?
   - Check: Are cookies being set correctly?

2. **Import page shows auth error when authenticated**
   - Check: Is cookie present in request?
   - Check: Is cookie validation logic correct?
   - Check: Is token format valid?

3. **State not syncing across tabs**
   - Check: Is StorageEvent listener registered?
   - Check: Is localStorage being updated on login?
   - Check: Are both tabs same-origin?

### Debugging Tools

```typescript
// Add debug logging
console.log('[AUTH DEBUG]', {
  cookie: getCookie('auth-token'),
  zustandState: useAuthStore.getState(),
  localStorage: localStorage.getItem('auth-store'), // Zustand persist key
});

// Monitor Zustand store changes
useAuthStore.subscribe((state) => {
  console.log('[AUTH DEBUG] Zustand store updated:', state);
});
```

## Success Criteria Checklist

- [ ] 100% of authenticated users see correct navbar state after login (SC-001)
- [ ] Zero authentication errors on import page for authenticated users (SC-002)
- [ ] All protected pages load without auth errors (SC-003)
- [ ] Navbar updates within 1 second of login/logout (SC-004)
- [ ] Cross-tab synchronization works correctly
- [ ] Session expiry shows toast with refresh option
- [ ] All tests pass (unit, integration, E2E)

## Next Steps

After implementing fixes:

1. Run test suite: `yarn test`
2. Run E2E tests: `yarn test:e2e`
3. Test manually: Login → Check navbar → Navigate → Check all pages
4. Verify cross-tab sync: Login in one tab → Check other tabs
5. Test session expiry: Wait for expiry → Verify toast → Test refresh
