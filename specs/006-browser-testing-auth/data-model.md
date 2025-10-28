# Data Model: Browser Testing and Authentication UX Improvements

**Feature**: 006-browser-testing-auth  
**Date**: 2025-01-26  
**Purpose**: Define data structures and relationships for authentication, navigation, and theme management

## Core Entities

### User Role

Represents different permission levels that determine page access and navigation visibility.

**Fields**:

- `id`: string (unique identifier)
- `name`: string (role name: 'admin', 'user', 'guest')
- `permissions`: Permission[] (array of permissions)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:

- `name` must be one of: 'admin', 'user', 'guest'
- `permissions` must be non-empty array
- `id` must be unique across all roles

**State Transitions**:

- Created → Active (when role is first created)
- Active → Inactive (when role is disabled)
- Inactive → Active (when role is re-enabled)

### Permission

Represents access control rules that determine which user roles can view specific pages.

**Fields**:

- `id`: string (unique identifier)
- `resource`: string (page or feature identifier)
- `action`: string ('read', 'write', 'admin')
- `roles`: string[] (array of role names that have this permission)
- `createdAt`: Date
- `updatedAt`: Date

**Validation Rules**:

- `resource` must be non-empty string
- `action` must be one of: 'read', 'write', 'admin'
- `roles` must contain valid role names
- `id` must be unique across all permissions

**State Transitions**:

- Created → Active (when permission is first created)
- Active → Inactive (when permission is disabled)
- Inactive → Active (when permission is re-enabled)

### Theme Preference

Represents user's visual theme choice that should persist across sessions.

**Fields**:

- `userId`: string (user identifier, null for guest users)
- `theme`: string ('light', 'dark', 'system')
- `updatedAt`: Date

**Validation Rules**:

- `theme` must be one of: 'light', 'dark', 'system'
- `userId` can be null for guest users
- Only one theme preference per user

**State Transitions**:

- Created → Active (when theme is first set)
- Active → Updated (when theme is changed)

### Navigation State

Represents the current navigation visibility and active page state that updates based on user context.

**Fields**:

- `userId`: string (user identifier, null for guest users)
- `activePage`: string (current page identifier)
- `visiblePages`: string[] (pages visible to current user)
- `lastUpdated`: Date

**Validation Rules**:

- `activePage` must be a valid page identifier
- `visiblePages` must contain only valid page identifiers
- `userId` can be null for guest users

**State Transitions**:

- Initialized → Updated (when user navigates)
- Updated → Updated (when permissions change)

### Authentication State

Represents the user's current login status and associated permissions that affect UI behavior.

**Fields**:

- `isAuthenticated`: boolean
- `userId`: string | null (user identifier)
- `userRole`: string | null (current user role)
- `permissions`: string[] (array of permission strings)
- `lastActivity`: Date

**Validation Rules**:

- `isAuthenticated` must be boolean
- If `isAuthenticated` is true, `userId` and `userRole` must be non-null
- If `isAuthenticated` is false, `userId` and `userRole` must be null
- `permissions` must be array of strings

**State Transitions**:

- Unauthenticated → Authenticated (when user logs in)
- Authenticated → Unauthenticated (when user logs out)
- Authenticated → Updated (when permissions change)

## Relationships

### User Role ↔ Permission (Many-to-Many)

- A role can have multiple permissions
- A permission can be assigned to multiple roles
- Relationship managed through `Permission.roles` array

### User ↔ Theme Preference (One-to-One)

- Each user has exactly one theme preference
- Guest users have theme preference with `userId: null`

### User ↔ Navigation State (One-to-One)

- Each user has exactly one navigation state
- Guest users have navigation state with `userId: null`

### User ↔ Authentication State (One-to-One)

- Each user has exactly one authentication state
- Guest users have authentication state with `isAuthenticated: false`

## Data Flow

### Theme Management

1. User changes theme → Theme Preference updated
2. Theme Preference change → UI components re-render
3. Theme Preference persisted to localStorage

### Permission Management

1. Admin updates permissions → Permission entity updated
2. Permission change → Navigation State recalculated
3. Navigation State change → UI components re-render

### Authentication Flow

1. User logs in → Authentication State updated
2. Authentication State change → Navigation State recalculated
3. Navigation State change → UI components re-render

## Validation Rules Summary

- All entities must have unique identifiers
- Role names must be predefined values
- Permission actions must be predefined values
- Theme values must be predefined values
- User relationships must be consistent (authenticated users must have userId)
- State transitions must follow defined rules
- All timestamps must be valid dates

## Storage Considerations

- **Theme Preference**: Stored in localStorage for persistence
- **Navigation State**: Stored in React state, recalculated on permission changes
- **Authentication State**: Stored in React state, persisted via Supabase Auth
- **User Role & Permission**: Stored in PostgreSQL via Prisma, cached in React state
