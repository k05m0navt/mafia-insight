# State Management Documentation

## Overview

The application uses a **hybrid state management approach** combining:

- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client-side global state
- **React Context** - Theme and provider state
- **React Hooks** - Local component state

---

## Server State Management

### TanStack Query (React Query)

**Location**: `src/lib/queryClient.ts`

**Configuration**:

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,         // 10 minutes (formerly cacheTime)
    retry: 3,
    refetchOnWindowFocus: false
  },
  mutations: {
    retry: 1
  }
}
```

**Features**:

- Automatic caching and background refetching
- Optimistic updates support
- Request deduplication
- Error handling and retry logic
- Loading states management

**Usage Pattern**:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query example
const { data, isLoading, error } = useQuery({
  queryKey: ['players', page, limit],
  queryFn: () => fetchPlayers(page, limit),
});

// Mutation example
const mutation = useMutation({
  mutationFn: createPlayer,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['players'] });
  },
});
```

---

## Client State Management

### Zustand Stores

#### 1. Auth Store

**Location**: `src/store/authStore.ts`

**Purpose**: Authentication state and user session management

**State Structure**:

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
```

**Actions**:

- `login(email, password)` - User login
- `signup(email, password, confirmPassword)` - User registration
- `logout()` - User logout
- `checkAuthStatus()` - Verify authentication status
- `clearError()` - Clear error state
- `setLoading(loading)` - Set loading state
- `updateUser(user)` - Update user data
- `updatePermissions(permissions)` - Update user permissions

**Persistence**:

- Uses `persist` middleware
- Stored in localStorage as `auth-store`
- Persists: `isAuthenticated`, `user`
- Does NOT persist: `isLoading`, `error`

**Selectors**:

- `useAuthState()` - Full auth state
- `useCurrentUser()` - Current user
- `useIsAuthenticated()` - Authentication status
- `useIsLoading()` - Loading state
- `useAuthError()` - Error state
- `useUserRole()` - User role
- `useIsAdmin()` - Admin check

**Key Features**:

- Cookie-based authentication verification
- Automatic session refresh on expiry
- Permission management integration
- Error recovery with retry logic

---

#### 2. Analytics Store

**Location**: `src/store/analyticsStore.ts`

**Purpose**: Analytics filters and selection state

**State Structure**:

```typescript
interface AnalyticsState {
  selectedRole: string | null;
  timeRange: string;
  selectedPlayer: string | null;
  selectedClub: string | null;
  selectedTournament: string | null;
}
```

**Actions**:

- `setSelectedRole(role)` - Set selected role filter
- `setTimeRange(range)` - Set time range filter
- `setSelectedPlayer(playerId)` - Set selected player
- `setSelectedClub(clubId)` - Set selected club
- `setSelectedTournament(tournamentId)` - Set selected tournament

**DevTools**: Enabled with Zustand devtools middleware

**Persistence**: Not persisted (session-only)

---

## Custom Hooks

### Authentication Hooks

#### useAuth

**Location**: `src/hooks/useAuth.ts`

**Purpose**: Authentication operations and state

**Returns**:

```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials) => Promise<AuthResponse>;
  register: (userData) => Promise<AuthResponse>;
  logout: () => void;
  resetPassword: (email) => Promise<{success, message}>;
  updateProfile: (profileData) => Promise<AuthResponse>;
  clearError: () => void;
}
```

**Features**:

- Automatic auth state initialization
- Cookie-based authentication check
- Event listeners for auth changes
- Page visibility change detection
- Error handling and recovery

---

#### useRole

**Location**: `src/hooks/useRole.ts`

**Purpose**: Role-based access control

**Returns**:

```typescript
{
  currentRole: UserRole;
  hasMinimumRole: (role) => boolean;
  canAccessFeature: (feature) => boolean;
}
```

---

#### usePermissions

**Location**: `src/hooks/usePermissions.ts`

**Purpose**: Permission-based access control

**Returns**:

```typescript
{
  permissions: string[];
  canPerformAction: (action) => boolean;
  hasPermission: (resource, action) => boolean;
}
```

---

### Data Fetching Hooks

#### usePlayers

**Location**: `src/hooks/usePlayers.ts`

**Purpose**: Players data fetching with pagination and filtering

**Options**:

```typescript
{
  page?: number;
  limit?: number;
  search?: string;
  syncStatus?: string;
  clubId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}
```

**Returns**:

```typescript
{
  players: Player[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page) => void;
  setLimit: (limit) => void;
  setSearch: (search) => void;
  setSyncStatus: (status) => void;
  setClubId: (clubId) => void;
  setSortBy: (sortBy) => void;
  setSortOrder: (order) => void;
}
```

---

#### useGames

**Location**: `src/hooks/useGames.ts`

**Purpose**: Games data fetching

**Similar pattern to usePlayers**

---

#### useImportStatus

**Location**: `src/hooks/useImportStatus.ts`

**Purpose**: Import progress and status tracking

**Features**:

- Real-time progress updates
- Status polling
- Error handling

---

#### useImportControls

**Location**: `src/hooks/useImportControls.ts`

**Purpose**: Import control operations (start, stop, pause, resume)

---

#### useImportTrigger

**Location**: `src/hooks/useImportTrigger.ts`

**Purpose**: Trigger import operations

---

### Other Hooks

#### useDebounce

**Location**: `src/hooks/useDebounce.ts`

**Purpose**: Debounce values for search/filter inputs

---

#### useTheme

**Location**: `src/hooks/useTheme.ts`

**Purpose**: Theme management (light/dark/system)

---

#### useSession

**Location**: `src/hooks/useSession.ts`

**Purpose**: Session management

---

#### useSyncStatus

**Location**: `src/hooks/useSyncStatus.ts`

**Purpose**: Sync status tracking

---

#### useUserManagement

**Location**: `src/hooks/useUserManagement.ts`

**Purpose**: User management operations (Admin)

---

#### useAdminDashboard

**Location**: `src/hooks/useAdminDashboard.ts`

**Purpose**: Admin dashboard data and operations

---

#### useApiCache

**Location**: `src/hooks/useApiCache.ts`

**Purpose**: API response caching utilities

---

#### useMobileMenu

**Location**: `src/hooks/useMobileMenu.ts`

**Purpose**: Mobile navigation menu state

---

#### useNavigation

**Location**: `src/hooks/useNavigation.ts`

**Purpose**: Navigation state and operations

---

#### useProfile

**Location**: `src/hooks/useProfile.ts`

**Purpose**: User profile management

---

## State Management Patterns

### 1. Server State Pattern

**Use TanStack Query for**:

- API data fetching
- Caching server responses
- Background refetching
- Optimistic updates

**Example**:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['players', filters],
  queryFn: () => fetchPlayers(filters),
  staleTime: 5 * 60 * 1000,
});
```

---

### 2. Global Client State Pattern

**Use Zustand for**:

- Authentication state
- UI preferences (theme, filters)
- Cross-component state
- Session-only state

**Example**:

```typescript
const { user, isAuthenticated } = useAuthStore();
const { selectedRole, setSelectedRole } = useAnalyticsStore();
```

---

### 3. Local State Pattern

**Use React useState for**:

- Component-specific state
- Form inputs
- UI toggles
- Temporary state

**Example**:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});
```

---

### 4. Context Pattern

**Use React Context for**:

- Theme provider
- Provider composition
- Deep prop drilling avoidance

**Example**:

```typescript
<ThemeProvider>
  <QueryClientProvider>
    {children}
  </QueryClientProvider>
</ThemeProvider>
```

---

## State Synchronization

### Auth State Sync

- **Cookie** → Source of truth for SSR/API
- **Zustand Store** → Client-side state
- **React Hook** → Component state
- Synchronization on mount and auth events

### Data State Sync

- **TanStack Query** → Server data cache
- **Zustand** → Client-side filters/selections
- Automatic invalidation on mutations

---

## Persistence Strategy

### Persisted State

- **Auth Store**: `isAuthenticated`, `user` → localStorage
- **Theme Preference**: User preference → Database + localStorage

### Non-Persisted State

- **Analytics Store**: Session-only filters
- **TanStack Query Cache**: Memory cache (with gcTime)
- **Component State**: Component lifecycle only

---

## Error Handling

### TanStack Query Errors

- Automatic retry (3 attempts)
- Error boundaries
- Error state in query result

### Zustand Errors

- Error state in store
- Error recovery actions
- Error clearing mechanisms

### Hook Errors

- Try-catch in async operations
- Error state management
- User-friendly error messages

---

## Performance Optimizations

### Query Optimization

- Request deduplication
- Background refetching
- Stale-while-revalidate pattern
- Selective cache invalidation

### Store Optimization

- Selective subscriptions
- Memoized selectors
- Minimal re-renders

### Hook Optimization

- useCallback for stable functions
- useMemo for computed values
- Dependency array optimization

---

## State Management Architecture

```
┌─────────────────────────────────────────┐
│         React Components                │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼─────────┐
│ TanStack    │  │   Zustand     │
│ Query       │  │   Stores      │
│ (Server)    │  │  (Client)     │
└──────┬──────┘  └─────┬─────────┘
       │                │
       └───────┬────────┘
               │
       ┌───────▼──────────┐
       │   API Routes      │
       │   (Next.js)       │
       └───────────────────┘
```

Generated: 2025-11-22T17:39:05.300Z
