# Data Model: UX/UI and Data Improvements

**Feature**: 004-ux-data-improvements  
**Date**: 2025-01-27  
**Phase**: 1 - Design

## Entity Definitions

### User Roles

**Entity**: UserRole  
**Purpose**: Defines access levels for route protection and API authorization

**Fields**:

- `role`: enum ['GUEST', 'USER', 'ADMIN']
- `permissions`: string[] (array of permission strings)
- `description`: string (human-readable description)

**Relationships**:

- One-to-many with User entity
- Many-to-many with RouteProtection entity

**Validation Rules**:

- Role must be one of the defined enum values
- Permissions array cannot be empty for USER and ADMIN roles
- Description is required for documentation purposes

### Search Input State

**Entity**: SearchInputState  
**Purpose**: Manages debounced search input state and focus management

**Fields**:

- `value`: string (current input value)
- `debouncedValue`: string (debounced value for API calls)
- `isFocused`: boolean (focus state)
- `isLoading`: boolean (search loading state)
- `lastSearchTime`: DateTime (timestamp of last search)

**State Transitions**:

- `typing` → `debouncing` → `searching` → `idle`
- Focus state maintained throughout transitions

**Validation Rules**:

- Value cannot exceed 255 characters
- Debounced value updates after 300ms delay
- Focus state must be preserved during search operations

### Navigation Menu

**Entity**: NavigationMenu  
**Purpose**: Defines navigation structure with role-based visibility

**Fields**:

- `id`: string (unique identifier)
- `label`: string (display text)
- `href`: string (route path)
- `icon`: string (icon identifier)
- `requiredRole`: UserRole (minimum role required)
- `isVisible`: boolean (visibility flag)
- `order`: number (display order)

**Relationships**:

- Many-to-one with UserRole entity
- Self-referencing for sub-menu items

**Validation Rules**:

- Href must be valid Next.js route
- Required role must be valid UserRole
- Order must be unique within same level
- Label cannot be empty

### Import Progress

**Entity**: ImportProgress  
**Purpose**: Tracks real-time progress of data import operations

**Fields**:

- `id`: string (unique identifier)
- `operation`: string (current operation name)
- `progress`: number (percentage complete, 0-100)
- `totalRecords`: number (total records to process)
- `processedRecords`: number (records processed)
- `errors`: number (error count)
- `startTime`: DateTime (operation start time)
- `estimatedCompletion`: DateTime (estimated completion time)
- `status`: enum ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']

**State Transitions**:

- `PENDING` → `RUNNING` → `COMPLETED` | `FAILED` | `CANCELLED`

**Validation Rules**:

- Progress must be between 0 and 100
- Processed records cannot exceed total records
- Status transitions must follow defined flow
- Estimated completion must be after start time

### Player Statistics Enhancement

**Entity**: PlayerStatisticsEnhancement  
**Purpose**: Enhanced player data including tournament history and year-based filtering

**Fields**:

- `playerId`: string (reference to Player entity)
- `tournamentHistory`: TournamentParticipation[] (tournament participation records)
- `yearStats`: PlayerYearStats[] (year-based statistics)
- `gameDetails`: GameParticipation[] (detailed game participation)
- `lastUpdated`: DateTime (last update timestamp)

**Relationships**:

- One-to-one with Player entity
- One-to-many with TournamentParticipation
- One-to-many with PlayerYearStats
- One-to-many with GameParticipation

**Validation Rules**:

- PlayerId must reference existing Player
- Tournament history must be sorted by date
- Year stats must cover all years with data
- Game details must include role and team information

### Region Filter

**Entity**: RegionFilter  
**Purpose**: Manages region-based filtering for player lists

**Fields**:

- `id`: string (unique identifier)
- `name`: string (region display name)
- `code`: string (region code from GoMafia)
- `country`: string (country name)
- `isActive`: boolean (filter availability)
- `playerCount`: number (number of players in region)

**Relationships**:

- One-to-many with Player entity
- Many-to-one with GoMafiaRegion entity

**Validation Rules**:

- Name and code cannot be empty
- Code must be unique
- Player count must be non-negative
- Region must be imported from GoMafia

### Theme Configuration

**Entity**: ThemeConfiguration  
**Purpose**: Manages theme switching and user preferences

**Fields**:

- `id`: string (unique identifier)
- `userId`: string (reference to User entity)
- `theme`: enum ['LIGHT', 'DARK', 'SYSTEM']
- `customColors`: object (user-defined color overrides)
- `lastUpdated`: DateTime (last preference update)

**Relationships**:

- One-to-one with User entity

**Validation Rules**:

- Theme must be valid enum value
- Custom colors must follow CSS color format
- UserId must reference existing User
- Last updated must be current timestamp

### API Documentation

**Entity**: APIDocumentation  
**Purpose**: Manages API documentation for public and private endpoints

**Fields**:

- `endpointId`: string (unique identifier)
- `path`: string (API endpoint path)
- `method`: enum ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
- `description`: string (endpoint description)
- `parameters`: APIParameter[] (request parameters)
- `responses`: APIResponse[] (response schemas)
- `authentication`: enum ['NONE', 'USER', 'ADMIN'] (required auth level)
- `isPublic`: boolean (public visibility flag)
- `lastUpdated`: DateTime (last documentation update)

**Relationships**:

- One-to-many with APIParameter
- One-to-many with APIResponse

**Validation Rules**:

- Path must be valid URL format
- Method must be valid HTTP method
- Parameters must have type and description
- Responses must include status codes and schemas
- Authentication level must match endpoint requirements

## Data Flow Patterns

### Search Input Flow

1. User types in input field
2. Value stored in SearchInputState
3. Debounce timer starts (300ms)
4. On timer completion, debouncedValue updated
5. API call triggered with debouncedValue
6. Results displayed, focus maintained

### Navigation Flow

1. User accesses any page
2. NavigationMenu loaded based on user role
3. Menu items filtered by requiredRole
4. User clicks navigation item
5. Next.js Link handles client-side navigation
6. Target page loads with appropriate access control

### Import Progress Flow

1. Import operation starts
2. ImportProgress entity created with RUNNING status
3. Progress updates sent via SSE every 5 seconds
4. Frontend receives updates and displays progress
5. Operation completes, status updated to COMPLETED/FAILED
6. Final statistics logged and displayed

### Theme Switching Flow

1. User toggles theme preference
2. ThemeConfiguration updated in database
3. CSS custom properties updated
4. localStorage updated for persistence
5. All components re-render with new theme
6. Theme persists across page navigation

## Validation Rules Summary

- All string fields have maximum length limits
- Enum fields must use predefined values
- DateTime fields must be valid timestamps
- Numeric fields have appropriate ranges
- Foreign key references must exist
- State transitions follow defined flows
- Required fields cannot be null or empty
- Unique constraints enforced where specified

## Performance Considerations

- Search input debouncing reduces API calls by 80%
- Navigation menu cached based on user role
- Import progress updates limited to 5-second intervals
- Theme switching uses CSS custom properties for performance
- Region filters indexed for fast querying
- API documentation generated statically for performance
