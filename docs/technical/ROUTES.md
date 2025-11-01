# Mafia Insight - Routes Documentation

Complete documentation of all routes, their purpose, authentication requirements, and access control.

---

## 🔓 Public Routes (No Authentication Required)

These routes are accessible to everyone, including non-authenticated users.

### Home & Landing

- **`/`** - Homepage
  - Description: Landing page with platform overview and features
  - Access: Public
  - Components: Hero section, feature cards, role cards, CTA buttons

### Authentication

- **`/login`** - Login Page
  - Description: User login form
  - Access: Public (redirects if already authenticated)
  - Features: Email/password login, "Remember me", redirect to origin page

- **`/signup`** - Signup Page
  - Description: New user registration
  - Access: Public (redirects if already authenticated)
  - Features: Email/password signup, password confirmation, name field

- **`/admin/bootstrap`** - Admin Bootstrap
  - Description: Create first admin user (only works when no admins exist)
  - Access: Public (one-time use)
  - Features: Secure admin creation, automatic lock after first admin

### Error Pages

- **`/error`** - General Error Page
  - Description: Generic error handler
  - Access: Public

- **`/expired`** - Session Expired
  - Description: Shown when session expires
  - Access: Public

- **`/unauthorized`** - Unauthorized Access
  - Description: Shown when user tries to access protected resource
  - Access: Public

- **`/network-error`** - Network Error
  - Description: Shown on network connectivity issues
  - Access: Public

- **`/access-denied`** - Access Denied
  - Description: Shown when user doesn't have required permissions
  - Access: Public

---

## 🔒 Protected Routes (Authentication Required)

These routes require users to be logged in.

### User Dashboard

- **`/profile`** - User Profile
  - Description: View and edit user profile
  - Access: Authenticated users
  - Features:
    - Update name and email
    - Upload avatar (2MB limit, images only)
    - Change theme preference
    - View account details
    - Last login timestamp

- **`/settings`** - User Settings
  - Description: User preferences and configuration
  - Access: Authenticated users
  - Features:
    - Theme settings (light/dark/system)
    - Notification preferences
    - Account settings

### Data Pages

- **`/players`** - Players List
  - Description: Browse all players with stats
  - Access: ✅ **Authenticated users** (Protected)
  - Features:
    - Search by name
    - Filter by sync status
    - Sort by ELO, games, wins, losses
    - Pagination (10 per page)
    - View player cards with key stats

- **`/players/[id]`** - Player Detail
  - Description: Individual player profile with complete statistics
  - Access: Authenticated users
  - Features:
    - Detailed statistics
    - Game history
    - Role performance breakdown
    - ELO rating history
    - Tournament participation

- **`/players/[id]/statistics`** - Player Statistics
  - Description: Advanced statistics and analytics for a player
  - Access: Authenticated users
  - Features:
    - Win rate by role
    - Performance trends
    - Head-to-head comparisons

- **`/games`** - Games List
  - Description: Browse all game records
  - Access: ✅ **Authenticated users** (Protected)
  - Features:
    - Filter by player, tournament, date
    - Sort by date, duration
    - View game outcomes
    - Pagination

- **`/games/[id]`** - Game Detail
  - Description: Individual game details with participants
  - Access: Authenticated users
  - Features:
    - Game outcome
    - Player roles and teams
    - Game duration
    - Winner team
    - Participant performance

- **`/tournaments`** - Tournaments List
  - Description: Browse all tournaments
  - Access: ✅ **Authenticated users** (Protected)
  - Features:
    - Filter by status, date, rating
    - Sort by date, prize pool
    - View tournament brackets
    - Pagination

- **`/tournaments/[id]`** - Tournament Detail
  - Description: Individual tournament with participants and games
  - Access: Authenticated users
  - Features:
    - Tournament bracket
    - Participant list
    - Prize pool
    - Tournament statistics
    - Games played

- **`/clubs`** - Clubs List
  - Description: Browse all mafia clubs
  - Access: ✅ **Authenticated users** (Protected)
  - Features:
    - Filter by region
    - Sort by member count
    - View club info
    - Club logos

- **`/clubs/[id]`** - Club Detail
  - Description: Individual club profile with members
  - Access: Authenticated users
  - Features:
    - Club members
    - Club president
    - Regional information
    - Club statistics

### Progress Tracking

- **`/import-progress`** - Import Progress
  - Description: Track data import from gomafia.pro
  - Access: Authenticated users
  - Features:
    - Real-time progress updates
    - Current operation
    - Records processed
    - Estimated completion time
    - Error reporting

- **`/sync-status`** - Sync Status
  - Description: View synchronization status and history
  - Access: Authenticated users
  - Features:
    - Current sync state
    - Last sync timestamp
    - Sync logs history
    - Manual sync trigger (admin only)

---

## 👑 Admin Routes (Admin Role Required)

These routes are restricted to users with the `admin` role.

### User Management

- **`/admin`** - Admin Dashboard
  - Description: Central admin control panel
  - Access: ✅ **Admin only**
  - Features:
    - User management overview
    - System statistics
    - Recent activity
    - Quick actions

- **`/admin/users`** - User Management
  - Description: Manage all users
  - Access: ✅ **Admin only**
  - Features:
    - List all users
    - Search and filter users
    - Change user roles (user/moderator/admin)
    - Delete users
    - View user activity
    - Pagination

- **`/admin/permissions`** - Permissions Management
  - Description: Configure role-based permissions
  - Access: ✅ **Admin only**
  - Features:
    - Define role permissions
    - Assign permissions to roles
    - View permission matrix

### Data Management

- **`/admin/regions`** - Regions Management
  - Description: Manage geographic regions
  - Access: ✅ **Admin only**
  - Features:
    - Add/edit/delete regions
    - View region statistics
    - Assign clubs to regions

- **`/(admin)/import`** - Data Import (Admin Group)
  - Description: Trigger and monitor data imports
  - Access: ✅ **Admin only**
  - Features:
    - Start full/incremental import
    - Monitor progress
    - View import logs
    - Resume failed imports

- **`/(admin)/page.tsx`** - Admin Layout
  - Description: Admin section layout wrapper
  - Access: ✅ **Admin only**

### Testing Routes

- **`/test-players`** - Test Players List
  - Description: Testing environment for player features
  - Access: Authenticated users (dev/staging only)

- **`/test-players/[id]`** - Test Player Detail
  - Description: Testing environment for player detail page
  - Access: Authenticated users (dev/staging only)

---

## 🛠️ API Routes

### Authentication API

- **`POST /api/auth/login`** - User Login
  - Description: Authenticate user with email/password
  - Access: Public
  - Request: `{ email: string, password: string }`
  - Response: `{ success: boolean, user?: User, token?: string, error?: string }`

- **`POST /api/auth/signup`** - User Registration
  - Description: Register new user account
  - Access: Public
  - Request: `{ name: string, email: string, password: string, confirmPassword: string }`
  - Response: `{ success: boolean, user?: User, error?: string }`

- **`POST /api/auth/logout`** - User Logout
  - Description: Logout current user
  - Access: Authenticated
  - Response: `{ success: boolean }`

### User & Profile API

- **`GET /api/profile`** - Get User Profile
  - Description: Fetch current user profile
  - Access: Authenticated
  - Response: `{ user: User }`

- **`PATCH /api/profile`** - Update Profile
  - Description: Update user profile information
  - Access: Authenticated
  - Request: `{ name?: string, avatar?: string, themePreference?: string }`
  - Response: `{ success: boolean, user?: User }`

- **`POST /api/profile/avatar`** - Upload Avatar
  - Description: Upload user avatar image
  - Access: Authenticated
  - Request: FormData with image file
  - Response: `{ success: boolean, avatarUrl?: string }`

### Admin API

- **`GET /api/admin/users`** - List All Users
  - Description: Fetch all users with pagination
  - Access: Admin only
  - Query: `?page=1&limit=10&search=&role=`
  - Response: `{ users: User[], pagination: PaginationData }`

- **`PATCH /api/users/[id]/role`** - Change User Role
  - Description: Update user's role
  - Access: Admin only
  - Request: `{ role: 'user' | 'moderator' | 'admin' }`
  - Response: `{ success: boolean, user?: User }`

- **`DELETE /api/users/[id]`** - Delete User
  - Description: Remove user account
  - Access: Admin only
  - Response: `{ success: boolean }`

- **`POST /api/admin/bootstrap`** - Bootstrap Admin
  - Description: Create first admin user
  - Access: Public (one-time use)
  - Request: `{ email: string, password: string, confirmPassword: string }`
  - Response: `{ success: boolean, user?: User }`

- **`GET /api/admin/bootstrap/check`** - Check Bootstrap Status
  - Description: Check if admin already exists
  - Access: Public
  - Response: `{ hasAdmin: boolean }`

### Data API

- **`GET /api/players`** - List Players
  - Description: Fetch players with filtering and pagination
  - Access: Authenticated
  - Query: `?page=1&limit=10&search=&sortBy=eloRating&sortOrder=desc`
  - Response: `{ players: Player[], pagination: PaginationData }`

- **`GET /api/players/[id]`** - Get Player Details
  - Description: Fetch individual player details
  - Access: Authenticated
  - Response: `{ player: Player }`

- **`GET /api/players/[id]/statistics`** - Player Statistics
  - Description: Fetch detailed player statistics
  - Access: Authenticated
  - Response: `{ statistics: PlayerStatistics }`

- **`GET /api/games`** - List Games
  - Description: Fetch games with filtering
  - Access: Authenticated
  - Query: `?page=1&limit=10&playerId=&tournamentId=`
  - Response: `{ games: Game[], pagination: PaginationData }`

- **`GET /api/games/[id]`** - Get Game Details
  - Description: Fetch individual game details
  - Access: Authenticated
  - Response: `{ game: Game }`

- **`GET /api/tournaments`** - List Tournaments
  - Description: Fetch tournaments with filtering
  - Access: Authenticated
  - Query: `?page=1&limit=10&status=&sortBy=startDate`
  - Response: `{ tournaments: Tournament[], pagination: PaginationData }`

- **`GET /api/tournaments/[id]`** - Get Tournament Details
  - Description: Fetch individual tournament details
  - Access: Authenticated
  - Response: `{ tournament: Tournament }`

- **`GET /api/clubs`** - List Clubs
  - Description: Fetch clubs with filtering
  - Access: Authenticated
  - Query: `?page=1&limit=10&region=`
  - Response: `{ clubs: Club[], pagination: PaginationData }`

- **`GET /api/clubs/[id]`** - Get Club Details
  - Description: Fetch individual club details
  - Access: Authenticated
  - Response: `{ club: Club }`

### Sync & Import API

- **`POST /api/gomafia-sync/trigger`** - Trigger Sync
  - Description: Manually trigger data synchronization
  - Access: Admin only
  - Request: `{ type: 'FULL' | 'INCREMENTAL' }`
  - Response: `{ success: boolean, syncLogId?: string }`

- **`GET /api/gomafia-sync/status`** - Sync Status
  - Description: Get current sync status
  - Access: Authenticated
  - Response: `{ syncStatus: SyncStatus }`

- **`GET /api/gomafia-sync/logs`** - Sync Logs
  - Description: Get sync history
  - Access: Admin only
  - Query: `?page=1&limit=10`
  - Response: `{ logs: SyncLog[], pagination: PaginationData }`

- **`POST /api/gomafia-sync/import`** - Start Import
  - Description: Start data import from gomafia.pro
  - Access: Admin only
  - Response: `{ success: boolean, importId?: string }`

- **`GET /api/import/progress`** - Import Progress
  - Description: Get current import progress
  - Access: Authenticated
  - Response: `{ progress: ImportProgress }`

- **`GET /api/import/progress/stream`** - Import Progress Stream
  - Description: Server-sent events for real-time progress
  - Access: Authenticated
  - Response: EventStream

### Cron & Background Jobs

- **`GET /api/cron/daily-sync`** - Daily Sync Cron
  - Description: Automated daily data synchronization
  - Access: Cron service (requires CRON_SECRET header)
  - Headers: `Authorization: Bearer {CRON_SECRET}`
  - Response: `{ success: boolean }`

### Notifications API

- **`GET /api/notifications`** - Get Notifications
  - Description: Fetch user notifications
  - Access: Authenticated
  - Query: `?unreadOnly=true`
  - Response: `{ notifications: Notification[] }`

- **`PATCH /api/notifications/[id]`** - Mark as Read
  - Description: Mark notification as read
  - Access: Authenticated
  - Response: `{ success: boolean }`

### Navigation & Utility API

- **`GET /api/navigation/menu`** - Get Navigation Menu
  - Description: Fetch navigation items based on user role
  - Access: Authenticated
  - Response: `{ menuItems: MenuItem[] }`

- **`GET /api/theme`** - Get Theme Preference
  - Description: Fetch user's theme preference
  - Access: Authenticated
  - Response: `{ theme: 'light' | 'dark' | 'system' }`

- **`POST /api/theme`** - Set Theme Preference
  - Description: Update user's theme preference
  - Access: Authenticated
  - Request: `{ theme: 'light' | 'dark' | 'system' }`
  - Response: `{ success: boolean }`

### Search API

- **`GET /api/search/players`** - Search Players
  - Description: Search players with advanced filters
  - Access: Authenticated
  - Query: `?q=query&syncStatus=&clubId=&sortBy=&sortOrder=&page=1&limit=10`
  - Response: `{ players: Player[], pagination: PaginationData }`

### Analytics API

- **`GET /api/analytics/leaderboard`** - Leaderboard
  - Description: Fetch player leaderboard
  - Access: Authenticated
  - Query: `?type=elo&limit=100`
  - Response: `{ leaderboard: Player[] }`

- **`GET /api/players/[id]/analytics`** - Player Analytics
  - Description: Fetch player analytics data
  - Access: Authenticated
  - Response: `{ analytics: PlayerAnalytics }`

- **`GET /api/tournaments/[id]/analytics`** - Tournament Analytics
  - Description: Fetch tournament analytics data
  - Access: Authenticated
  - Response: `{ analytics: TournamentAnalytics }`

- **`GET /api/clubs/[id]/analytics`** - Club Analytics
  - Description: Fetch club analytics data
  - Access: Authenticated
  - Response: `{ analytics: ClubAnalytics }`

### Database & Testing API

- **`GET /api/test-db`** - Test Database Connection
  - Description: Verify database connectivity
  - Access: Public (dev only)
  - Response: `{ connected: boolean }`

### API Documentation

- **`GET /api-docs/swagger`** - Swagger UI
  - Description: Interactive API documentation
  - Access: Public
  - Features: Try-it-out functionality, schemas, examples

- **`GET /api-docs/openapi.json`** - OpenAPI Spec
  - Description: OpenAPI 3.0 specification
  - Access: Public
  - Response: OpenAPI JSON

---

## 🔐 Authentication & Authorization Summary

### Authentication Levels

1. **Public** - No authentication required
2. **Authenticated** - Requires login (any role)
3. **Admin** - Requires login + admin role

### Protected Route Groups

| Route Pattern       | Auth Required | Role Required | Notes                         |
| ------------------- | ------------- | ------------- | ----------------------------- |
| `/`                 | ❌ No         | -             | Public homepage               |
| `/login`, `/signup` | ❌ No         | -             | Public auth pages             |
| `/players`          | ✅ **Yes**    | User          | **Protected**                 |
| `/games`            | ✅ **Yes**    | User          | **Protected**                 |
| `/tournaments`      | ✅ **Yes**    | User          | **Protected**                 |
| `/clubs`            | ✅ **Yes**    | User          | **Protected**                 |
| `/profile`          | ✅ Yes        | User          | Protected                     |
| `/settings`         | ✅ Yes        | User          | Protected                     |
| `/import-progress`  | ✅ Yes        | User          | Protected                     |
| `/sync-status`      | ✅ Yes        | User          | Protected                     |
| `/admin/**`         | ✅ Yes        | Admin         | Admin only (except bootstrap) |
| `/admin/bootstrap`  | ❌ No         | -             | One-time public access        |

### Middleware Protection

The application uses Next.js middleware (`middleware.ts`) to enforce authentication:

- **Redirects unauthenticated users** to `/login` with return URL
- **Checks role-based access** for admin routes
- **Sets authentication cookies** on login/signup
- **Clears cookies** on logout
- **Validates session** on each protected route access

---

## 🧭 Route Protection Implementation

### How It Works

1. **Login/Signup** → Sets `auth-token` and `user-role` cookies
2. **Middleware** → Checks cookies on each request
3. **Protected Route** → Middleware verifies authentication
4. **Unauthorized** → Redirects to `/login` or `/unauthorized`
5. **Logout** → Clears cookies and redirects to `/`

### Adding New Protected Routes

To protect a new route:

1. Add route pattern to `protectedRoutes` array in `middleware.ts`
2. For admin-only routes, add to `adminRoutes` array
3. Middleware will automatically enforce protection

### Checking Auth in Components

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.name}!</div>;
}
```

---

## 📊 Route Statistics

- **Total Routes**: 50+
- **Public Routes**: 10
- **Protected Routes**: 20+
- **Admin Routes**: 10+
- **API Endpoints**: 40+

---

**Last Updated**: October 30, 2025
