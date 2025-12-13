# Architecture

## Executive Summary

**Mafia Insight** uses **Clean Architecture + Hexagonal Architecture** patterns in a monolithic Next.js 16 application. The architecture emphasizes separation of concerns, dependency inversion, and framework independence for the domain layer. This document defines the integration architecture—how existing decisions work together and the patterns AI agents must follow for consistent implementation.

**Architecture Type**: Monolith (single-part application)  
**Primary Framework**: Next.js 16.0.0 with App Router  
**Architecture Pattern**: Clean Architecture + Hexagonal Architecture  
**Deployment Target**: Vercel

---

## Project Initialization

**Starter Template**: None - Project was manually initialized

**Initial Setup**:

- Next.js 16 with App Router
- TypeScript 5.0.0
- Tailwind CSS 3.3.0
- ShadCN/UI components (copy-paste model)
- Project structure organized manually

**Note**: This is a brownfield project. All architectural decisions documented here are already implemented. This document serves as the consistency contract for AI agents implementing new features.

---

## Decision Summary

| Category             | Decision               | Version               | Affects FR Categories | Rationale                                                   |
| -------------------- | ---------------------- | --------------------- | --------------------- | ----------------------------------------------------------- |
| Framework            | Next.js                | 16.0.0                | All                   | Modern React framework with App Router, SSR, and API routes |
| Language             | TypeScript             | 5.0.0                 | All                   | Type safety across entire application                       |
| UI Library           | React                  | 19.2.0                | All UI features       | Component framework                                         |
| Styling              | Tailwind CSS           | 3.3.0                 | All UI features       | Utility-first CSS framework                                 |
| Component Library    | ShadCN/UI              | Latest (copy-paste)   | All UI features       | Accessible components, full customization control           |
| Database             | PostgreSQL             | Latest (via Supabase) | Data persistence      | Relational database with ACID guarantees                    |
| ORM                  | Prisma                 | 5.0.0                 | Data persistence      | Type-safe database access, migrations                       |
| Backend Platform     | Supabase               | 2.38.0                | Auth, Database        | BaaS with PostgreSQL, Auth, Storage                         |
| Server State         | TanStack Query         | 5.0.0                 | Data fetching         | Efficient caching, background refetching                    |
| Client State         | Zustand                | 4.4.0                 | UI state              | Lightweight global state management                         |
| Authentication       | NextAuth.js            | 4.24.12               | User Account & Access | Session management, OAuth providers                         |
| Validation           | Zod                    | 4.1.12                | All API endpoints     | Schema validation for requests/responses                    |
| Testing (Unit)       | Vitest                 | 1.0.0                 | All                   | Fast unit and integration testing                           |
| Testing (E2E)        | Playwright             | 1.56.1                | All                   | End-to-end browser testing                                  |
| Deployment           | Vercel                 | Latest                | All                   | Serverless deployment, edge network                         |
| Caching              | Redis                  | 4.6.0                 | Performance           | Session storage, rate limiting, caching                     |
| Architecture Pattern | Clean Architecture     | N/A                   | All                   | Separation of concerns, testability                         |
| Architecture Pattern | Hexagonal Architecture | N/A                   | All                   | Ports and adapters, framework independence                  |

---

## Project Structure

```
mafia-insight/
├── src/
│   ├── app/                    # Next.js App Router (Presentation Layer)
│   │   ├── (auth)/            # Auth route group
│   │   ├── (dashboard)/       # Dashboard route group
│   │   ├── api/               # API routes (62 endpoints)
│   │   │   ├── players/       # Player endpoints
│   │   │   ├── games/         # Game endpoints
│   │   │   ├── tournaments/   # Tournament endpoints
│   │   │   ├── clubs/         # Club endpoints
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── admin/         # Admin endpoints
│   │   │   └── gomafia-sync/  # Data sync endpoints
│   │   ├── admin/             # Admin pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React Components (Presentation Layer)
│   │   ├── ui/               # Base UI components (ShadCN/UI)
│   │   ├── auth/             # Authentication components
│   │   ├── admin/            # Admin components
│   │   ├── analytics/         # Analytics components
│   │   ├── data-display/     # Data presentation components
│   │   ├── sync/             # Sync components
│   │   ├── import/           # Import components
│   │   ├── navigation/       # Navigation components
│   │   ├── layout/           # Layout components
│   │   └── profile/          # Profile components
│   ├── adapters/             # Adapters Layer (Ports & Adapters)
│   │   ├── controllers/      # HTTP controllers
│   │   ├── gateways/         # External service adapters
│   │   └── presenters/       # Data presentation layer
│   ├── application/          # Application Layer (Use Cases)
│   │   ├── contracts/        # Application contracts/interfaces
│   │   ├── ports/            # Port interfaces
│   │   ├── use-cases/        # Business use cases
│   │   └── errors.ts         # Application errors
│   ├── domain/               # Domain Layer (Business Logic)
│   │   ├── entities/         # Domain entities
│   │   ├── services/         # Domain services
│   │   ├── value-objects/    # Value objects
│   │   └── errors/           # Domain errors
│   ├── infrastructure/       # Infrastructure Layer
│   │   ├── architecture/     # Architecture utilities
│   │   ├── caching/          # Caching implementations
│   │   ├── messaging/        # Messaging/events
│   │   ├── observability/    # Observability
│   │   └── persistence/      # Persistence layer
│   ├── lib/                  # Shared utilities and configurations
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database connection (Prisma)
│   │   ├── queryClient.ts    # TanStack Query client
│   │   ├── redis.ts          # Redis client
│   │   ├── supabase.ts       # Supabase client
│   │   ├── gomafia/          # GoMafia integration (43 files)
│   │   │   ├── import/       # Import orchestration
│   │   │   ├── scrapers/     # Web scrapers (Playwright)
│   │   │   ├── parsers/      # Data parsers
│   │   │   └── validators/   # Data validators
│   │   ├── validations.ts    # Zod schemas
│   │   └── utils.ts          # General utilities
│   ├── hooks/                # Custom React hooks (18 hooks)
│   ├── services/             # Service layer (16 services)
│   ├── store/                # Zustand stores (2 stores)
│   │   ├── authStore.ts     # Authentication state
│   │   └── analyticsStore.ts # Analytics filters
│   └── types/                # TypeScript type definitions
├── prisma/
│   ├── schema.prisma         # Database schema (18 models)
│   └── migrations/           # Database migrations
├── tests/                    # Test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── e2e/                 # E2E tests (Playwright)
│   └── components/          # Component tests
├── public/                   # Static assets
├── docs/                     # Documentation
├── specs/                    # Feature specifications
├── config/                   # Configuration files
│   └── architecture-rules.json # Dependency cruiser rules
├── next.config.mjs          # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.mjs      # Tailwind CSS configuration
├── components.json          # ShadCN/UI configuration
└── package.json             # Dependencies and scripts
```

---

## FR Category to Architecture Mapping

| FR Category                              | Architecture Location                                                             | Components                                       | Notes                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| User Account & Access (FR1-FR6)          | `src/app/(auth)/`, `src/components/auth/`, `src/lib/auth.ts`                      | Auth components, NextAuth.js, Supabase Auth      | Authentication, profiles, role management       |
| Data Import & Synchronization (FR7-FR15) | `src/lib/gomafia/`, `src/app/api/gomafia-sync/`, `src/components/sync/`           | Import orchestrator, scrapers, validators        | gomafia.pro integration with quality validation |
| Player Analytics (FR16-FR23)             | `src/app/api/players/`, `src/components/analytics/`, `src/application/use-cases/` | Player analytics use cases, analytics components | Role-based performance metrics and trends       |
| Judge Analytics (FR24-FR29)              | `src/app/api/players/[id]/analytics/`, `src/components/analytics/`                | Judge analytics components, player analytics API | Unique judge-specific tracking and metrics      |
| Timeline Visualization (FR30-FR36)       | `src/components/analytics/`, `src/app/api/games/`                                 | Timeline components, game data API               | Interactive historical data visualization       |
| Club Analytics (FR37-FR42)               | `src/app/api/clubs/`, `src/components/analytics/`                                 | Club analytics components, club API              | Team-level insights (Post-MVP)                  |
| Data Display & Navigation (FR43-FR48)    | `src/components/`, `src/app/`                                                     | Navigation components, layout components         | User interface and navigation capabilities      |
| Advanced Features (FR49-FR55)            | TBD (Post-MVP)                                                                    | TBD                                              | Custom dashboards, exports, AI insights         |
| Gamification (FR56-FR58)                 | TBD (Post-MVP)                                                                    | TBD                                              | Achievements, leaderboards, competitions        |
| Visual Design & UX (FR59-FR66)           | `src/components/ui/`, `src/styles/`, Tailwind config                              | ShadCN/UI components, Tailwind utilities         | Modern, rich design with animations             |

---

## Technology Stack Details

### Core Technologies

**Frontend Framework**:

- **Next.js 16.0.0** - React framework with App Router
  - Server Components for performance
  - File-based routing
  - Built-in API routes
  - Image optimization
  - Automatic code splitting

**Language**:

- **TypeScript 5.0.0** - Type-safe development
  - Strict mode enabled
  - Path aliases: `@/*` → `./src/*`
  - Module resolution: bundler

**UI Library**:

- **React 19.2.0** - Component framework
  - Server and Client Components
  - React Hooks
  - Concurrent features

**Styling**:

- **Tailwind CSS 3.3.0** - Utility-first CSS
  - Custom color theme (Competitive Data)
  - Responsive breakpoints
  - Dark theme support

**Component Library**:

- **ShadCN/UI** - Copy-paste component model
  - Built on Radix UI primitives
  - Full customization control
  - WCAG 2.1 Level AA accessible
  - Additional registries: @magicui, @blocks, @shadcnblocks, @reui, @smoothui

### Backend & Database

**Database**:

- **PostgreSQL** (via Supabase)
  - 18 Prisma models
  - Foreign key indexes for performance
  - Row Level Security (RLS) policies
  - Connection pooling recommended (PgBouncer)

**ORM**:

- **Prisma 5.0.0**
  - Type-safe database access
  - Migration management
  - Schema location: `prisma/schema.prisma`
  - Client generation: `yarn db:generate`

**Backend Platform**:

- **Supabase 2.38.0**
  - PostgreSQL database
  - Authentication (OAuth providers)
  - Storage (avatars, media)
  - Real-time capabilities (future)

### State Management

**Server State**:

- **TanStack Query 5.0.0**
  - Configuration: `src/lib/queryClient.ts`
  - Stale time: 5 minutes
  - GC time: 10 minutes
  - Retry: 3 attempts
  - Background refetching enabled

**Client State**:

- **Zustand 4.4.0**
  - Auth store: `src/store/authStore.ts` (persisted to localStorage)
  - Analytics store: `src/store/analyticsStore.ts` (session-only)
  - DevTools enabled

### Authentication

**Authentication Library**:

- **NextAuth.js 4.24.12**
  - Session management
  - OAuth providers (Google, Discord, GitHub)
  - Supabase adapter: `@next-auth/supabase-adapter`
  - Cookie-based sessions

**Authentication Flow**:

1. User authenticates via NextAuth.js
2. Session stored in secure HTTP-only cookie
3. Supabase Auth for OAuth providers
4. Zustand auth store syncs with session

### External Integrations

**GoMafia.pro Integration**:

- **Playwright** - Web scraping
- **Zod** - Data validation
- **Rate limiting** - 2-second delays (30 req/min)
- **Batch processing** - 100 records per batch
- **Checkpoint system** - Resume capability
- **Advisory locks** - Prevent concurrent imports
- **Failed Scraping Points Storage** - `SkippedEntity` model stores failed scraping operations
  - Automatic storage of failed pages, players, and entities during import
  - Manual and automatic retry capability via `SkippedEntitiesManager`
  - Status tracking: PENDING, RETRYING, COMPLETED, FAILED
  - Retry count tracking and exponential backoff
  - UI component: `SkippedEntitiesTable` for admin management

**Caching**:

- **Redis 4.6.0**
  - Session storage
  - Rate limiting
  - API response caching
  - Location: `src/lib/redis.ts`

### Testing

**Unit & Integration**:

- **Vitest 1.0.0**
  - Fast test runner
  - Coverage: `@vitest/coverage-v8`
  - Test location: `tests/unit/`, `tests/integration/`

**E2E Testing**:

- **Playwright 1.56.1**
  - Browser automation
  - Accessibility: `@axe-core/playwright`
  - Test location: `tests/e2e/`

**Component Testing**:

- **React Testing Library 16.0.0**
  - Component tests
  - Test location: `tests/components/`

### Development Tools

**Code Quality**:

- **ESLint 9.0.0** - Code linting
- **Prettier 3.0.0** - Code formatting
- **Husky 9.1.7** - Git hooks
- **lint-staged 16.2.6** - Pre-commit linting
- **dependency-cruiser 16.6.0** - Architecture validation

**Monitoring**:

- **Sentry 10.22.0** - Error tracking
- **web-vitals 5.1.0** - Performance monitoring

### Deployment

**Hosting**:

- **Vercel** - Serverless deployment
  - Automatic deployments on push
  - Preview deployments for PRs
  - Edge network for global CDN
  - Environment variables configured in dashboard

---

## Integration Points

### Request Flow

```
1. User Request (Browser)
   ↓
2. Next.js App Router (app/api/**/route.ts)
   ↓
3. HTTP Controller (adapters/controllers/)
   ↓
4. Use Case (application/use-cases/)
   ↓
5. Domain Service (domain/services/)
   ↓
6. Repository/Adapter (infrastructure/persistence/ or adapters/gateways/)
   ↓
7. Database (PostgreSQL via Prisma) or External API
   ↓
8. Response flows back up through layers
   ↓
9. Presenter (adapters/presenters/) formats response
   ↓
10. NextResponse.json() returns to client
```

### Component Data Flow

```
1. React Component (Presentation Layer)
   ↓
2. Custom Hook (hooks/) or Direct Service Call
   ↓
3. TanStack Query (Server State) or Zustand (Client State)
   ↓
4. API Route (app/api/)
   ↓
5. Controller → Use Case → Domain → Infrastructure
   ↓
6. Response cached by TanStack Query
   ↓
7. Component re-renders with data
```

### Authentication Flow

```
1. User Login (NextAuth.js)
   ↓
2. Session Created (HTTP-only cookie)
   ↓
3. Zustand Auth Store Updated
   ↓
4. API Routes Check Session (authenticateRequest middleware)
   ↓
5. Role/Permission Check (requireRole middleware)
   ↓
6. Access Granted/Denied
```

### Data Import Flow

```
1. User Triggers Import (API endpoint)
   ↓
2. Import Orchestrator (lib/gomafia/import/)
   ↓
3. Scraper (lib/gomafia/scrapers/) - Playwright
   ↓
4. On Scraping Failure:
   - SkippedEntity created (SkippedEntitiesManager)
   - Error details stored (errorCode, errorMessage, errorDetails)
   - Status set to PENDING
   - Available for manual/automatic retry
   ↓
5. Parser (lib/gomafia/parsers/) - Transform data
   ↓
6. Validator (lib/gomafia/validators/) - Zod validation
   ↓
7. Database Insert (Prisma) - Batch processing
   ↓
8. Checkpoint Saved (Resume capability)
   ↓
9. Progress Updated (Redis/SyncStatus table)
```

### Failed Scraping Points Retry Flow

```
1. Failed Scraping Detected
   ↓
2. SkippedEntity Recorded (SkippedEntitiesManager.recordSkippedEntity)
   - Phase: Import phase (PLAYERS, GAMES, etc.)
   - Entity Type: 'page', 'player', 'game', etc.
   - Entity ID: gomafiaId or page number
   - Error Code: Classification (SCRAPE_ERROR, PAGE_SKIP, etc.)
   - Error Message: Human-readable error
   - Error Details: JSON context (stack traces, request details)
   - Status: PENDING
   ↓
3. Automatic Retry (if enabled)
   - RetryManager with exponential backoff (1s, 2s, 4s)
   - Status updated to RETRYING
   - Retry count incremented
   ↓
4. Manual Retry (Admin UI)
   - SkippedEntitiesTable component displays failed entities
   - Admin selects entities to retry
   - RetryDialog triggers retry operation
   ↓
5. Retry Success
   - Status updated to COMPLETED
   - Entity processed and imported
   ↓
6. Retry Failure (after max retries)
   - Status updated to FAILED
   - Remains available for manual investigation
```

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Patterns

**API Routes**:

- **Endpoint naming**: Plural nouns (`/api/players`, `/api/games`)
- **Route parameters**: `[id]` format (`/api/players/[id]`)
- **Nested routes**: Descriptive paths (`/api/players/[id]/analytics`)

**Database**:

- **Table naming**: `snake_case`, plural (`users`, `game_participations`)
- **Column naming**: `snake_case` (`user_id`, `created_at`)
- **Foreign keys**: `{entity}_id` format (`player_id`, `tournament_id`)

**Components**:

- **Component files**: `PascalCase.tsx` (`PlayerCard.tsx`, `AuthProvider.tsx`)
- **Component names**: Match file name (`export const PlayerCard`)
- **Props interface**: `{ComponentName}Props` (`PlayerCardProps`)

**Functions & Variables**:

- **Functions**: `camelCase` (`getPlayerAnalytics`, `listPlayers`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `DEFAULT_PAGE_SIZE`)
- **Types/Interfaces**: `PascalCase` (`Player`, `ListPlayersRequest`)

**Hooks**:

- **Custom hooks**: `use` prefix (`useAuth`, `usePlayers`, `useImportStatus`)
- **Hook files**: `use{Name}.ts` (`useAuth.ts`, `usePlayers.ts`)

### Structure Patterns

**File Organization**:

- **Tests**: Co-located or in `tests/` directory
  - Unit tests: `tests/unit/`
  - Integration tests: `tests/integration/`
  - E2E tests: `tests/e2e/`
  - Component tests: `tests/components/`
- **Components**: Feature-based organization (`components/auth/`, `components/analytics/`)
- **Shared utilities**: `src/lib/` directory
- **Types**: `src/types/` or co-located with usage

**Layer Organization**:

- **Domain**: `src/domain/` - No external dependencies
- **Application**: `src/application/` - Can import domain only
- **Adapters**: `src/adapters/` - Can import application and domain
- **Infrastructure**: `src/infrastructure/` - Can import all inner layers
- **Presentation**: `src/app/`, `src/components/` - Can import all layers

**API Route Structure**:

```
app/api/{resource}/
├── route.ts              # List/Create endpoints
├── [id]/
│   ├── route.ts          # Get/Update/Delete endpoints
│   └── {action}/
│       └── route.ts      # Action endpoints (analytics, statistics)
```

### Format Patterns

**API Request Format**:

- **Query parameters**: Zod schema validation in route handler
- **Request body**: JSON, validated with Zod
- **Pagination**: `page` (default: 1), `limit` (default: 10, max: 100)

**API Response Format**:

- **Success responses**: Direct data or wrapped in `{ data: ... }`
- **List responses**: `{ items: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`
- **Error responses**: `{ error: string, code: string, message: string }`
- **Status codes**: 200 (success), 201 (created), 400 (validation), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

**Date/Time Format**:

- **Database**: PostgreSQL `TIMESTAMP` (UTC)
- **API responses**: ISO 8601 strings (`.toISOString()`)
- **API requests**: ISO 8601 strings or Unix timestamps
- **Date parsing**: `new Date(dateString)` with validation

**Error Format**:

```typescript
{
  error: string,           // User-friendly error message
  code: string,            // Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
  message?: string,        // Technical error message
  field?: string,          // Field name for validation errors
  context?: Record<string, unknown>  // Additional error context
}
```

**Cache Headers**:

- **Public endpoints**: `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`
- **Dynamic endpoints**: `Cache-Control: no-store, no-cache, must-revalidate`
- **Set in**: Route handler via `response.headers.set()`

### Communication Patterns

**Controller → Use Case**:

```typescript
// Controller calls use case
const result = await this.listPlayersUseCase.execute(request);
```

**Use Case → Domain Service**:

```typescript
// Use case orchestrates domain services
const player = await this.domainService.getPlayer(playerId);
```

**Use Case → Repository/Adapter**:

```typescript
// Use case calls repository through port interface
const players = await this.playerRepository.findAll(filters);
```

**Presenter Pattern**:

```typescript
// Presenter formats response
return NextResponse.json(PlayerPresenter.toListResponse(result));
```

**Event Handling** (Future):

- Event naming: `{entity}.{action}` (`player.created`, `game.completed`)
- Event payload: `{ entity: string, action: string, data: object, timestamp: Date }`

### Lifecycle Patterns

**Loading States**:

- **TanStack Query**: `isLoading`, `isFetching`, `isError` from query result
- **Components**: Skeleton loaders (`components/ui/skeleton.tsx`)
- **API Routes**: Return loading state in response if needed

**Error Recovery**:

- **TanStack Query**: Automatic retry (3 attempts)
- **API Routes**: Try-catch with error response
- **Components**: Error boundaries (`components/ErrorBoundary.tsx`)
- **User-facing**: Error messages via toast notifications

**Retry Logic**:

- **Import operations**: Exponential backoff (1s, 2s, 4s)
- **Failed scraping points**: Stored in `SkippedEntity` model for retry
  - Automatic retry: RetryManager with exponential backoff
  - Manual retry: Admin UI via `SkippedEntitiesTable` component
  - Retry tracking: Status (PENDING, RETRYING, COMPLETED, FAILED) and retry count
  - Error persistence: Error codes, messages, and details stored for debugging
- **API calls**: TanStack Query automatic retry
- **Manual retry**: User-triggered via UI buttons

### Location Patterns

**API Route URLs**:

- **Base**: `/api`
- **Resources**: `/api/{resource}` (plural)
- **Actions**: `/api/{resource}/[id]/{action}`
- **Examples**: `/api/players`, `/api/players/[id]/analytics`, `/api/gomafia-sync/import`

**Static Assets**:

- **Location**: `public/` directory
- **Icons**: `public/icons/` or `lucide-react` package
- **Images**: `public/` or Next.js Image component with remote patterns

**Config Files**:

- **Next.js**: `next.config.mjs` (root)
- **TypeScript**: `tsconfig.json` (root)
- **Tailwind**: `tailwind.config.mjs` (root)
- **Prisma**: `prisma/schema.prisma`
- **ESLint**: `eslint.config.js` (root)
- **Architecture rules**: `config/architecture-rules.json`

### Consistency Patterns

**Date Formatting in UI**:

- **Library**: `date-fns 4.1.0`
- **Format**: Use `format()` function with locale support
- **Timezone**: Display in user's timezone, store in UTC

**Logging**:

- **Format**: Structured logging with context
- **Levels**: `console.error()` for errors, `console.log()` for debug (dev only)
- **Error logging**: Include error code, message, and context

**User-Facing Errors**:

- **Format**: Clear, actionable messages
- **Display**: Toast notifications (`components/ui/toast.tsx`)
- **Codes**: Use error codes from `src/lib/errors.ts` or `src/application/errors.ts`

---

## Consistency Rules

### Naming Conventions

**Files**:

- **Components**: `PascalCase.tsx` (`PlayerCard.tsx`)
- **Hooks**: `use{Name}.ts` (`useAuth.ts`)
- **Utilities**: `camelCase.ts` (`utils.ts`, `validations.ts`)
- **Types**: `camelCase.ts` or co-located (`types.ts`, `player.types.ts`)
- **API Routes**: `route.ts` (Next.js convention)

**Code**:

- **Components**: `PascalCase` (`const PlayerCard = () => {}`)
- **Functions**: `camelCase` (`const getPlayer = () => {}`)
- **Constants**: `UPPER_SNAKE_CASE` (`const MAX_RETRIES = 3`)
- **Types/Interfaces**: `PascalCase` (`interface Player {}`)
- **Enums**: `PascalCase` with `UPPER_SNAKE_CASE` values (`enum Status { RUNNING = 'RUNNING' }`)

### Code Organization

**Import Order**:

1. External dependencies (React, Next.js, etc.)
2. Internal absolute imports (`@/lib/...`)
3. Relative imports (`./component`, `../utils`)
4. Types (at the end, with `type` keyword)

**Example**:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PlayersController } from '@/adapters/controllers/players-controller';
import { ApplicationValidationError } from '@/application/errors';
import type { ListPlayersRequest } from '@/application/contracts';
```

**Component Structure**:

1. Imports
2. Types/Interfaces
3. Component definition
4. Exports

**Layer Dependencies** (Enforced by dependency-cruiser):

- **Domain**: No dependencies on outer layers
- **Application**: Can import domain only
- **Adapters**: Can import application and domain
- **Infrastructure**: Can import all inner layers
- **Presentation**: Can import all layers

### Error Handling

**API Routes**:

```typescript
export async function GET(request: NextRequest) {
  try {
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApplicationValidationError) {
      return NextResponse.json(
        { error: error.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (error instanceof ApplicationNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
```

**Components**:

- Use Error Boundaries for unexpected errors
- Display user-friendly error messages
- Log errors to console (dev) or Sentry (prod)

**Use Cases**:

- Throw domain/application errors
- Let controllers handle error responses
- Include context in error objects

### Logging Strategy

**Format**: Structured logging with context
**Levels**:

- **Error**: `console.error()` - Always log errors
- **Warn**: `console.warn()` - Warnings and deprecations
- **Info**: `console.log()` - Development debugging only
- **Debug**: Remove or gate with `NODE_ENV === 'development'`

**Error Logging**:

```typescript
console.error('Error fetching players:', {
  error: error.message,
  code: error.code,
  context: error.context,
  timestamp: new Date().toISOString(),
});
```

**Production**: Errors automatically sent to Sentry via `@sentry/nextjs`

---

## Data Architecture

### Database Models

**Core Entities** (18 models):

- `User` - Platform users
- `Player` - Game players with judge capabilities
- `Club` - Gaming clubs/teams
- `Game` - Individual game instances
- `Tournament` - Competitive events
- `GameParticipation` - Player-game relationships
- `PlayerRoleStats` - Per-role statistics
- `PlayerYearStats` - Yearly aggregated statistics
- `PlayerTournament` - Tournament participation
- `Analytics` - Pre-computed metrics cache
- `SyncLog` - Synchronization logs
- `SyncStatus` - Current sync status (singleton)
- `ImportCheckpoint` - Import resumability
- `SkippedEntity` - Failed scraping points with retry capability
  - Stores failed pages, players, games, and other entities during import
  - Tracks retry attempts, error codes, and error details
  - Supports both automatic and manual retry operations
  - Status lifecycle: PENDING → RETRYING → COMPLETED/FAILED
- `Region` - Geographic regions
- `ImportProgress` - Import progress tracking
- `Notification` - User notifications
- `DataIntegrityReport` - Data integrity reports

**Relationships**:

- User → Players (one-to-many)
- Player → GameParticipations (one-to-many)
- Game → GameParticipations (one-to-many)
- Tournament → Games (one-to-many)
- Club → Players (one-to-many)
- Player → PlayerRoleStats (one-to-many)
- Player → PlayerYearStats (one-to-many)

**Indexes**:

- Foreign key indexes on all FK columns
- Composite indexes for common queries
- Unique constraints on `gomafiaId` fields

### Data Validation

**Validation Library**: Zod 4.1.12
**Validation Location**:

- API routes: Zod schemas in route handlers
- Domain: Zod schemas in domain validators
- Import: Zod schemas in `lib/gomafia/validators/`

**Validation Pattern**:

```typescript
const schema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const validated = schema.parse(data);
```

---

## API Contracts

### Request/Response Formats

**List Endpoints** (e.g., `/api/players`):

```typescript
// Request
GET /api/players?page=1&limit=10&search=name&sortBy=eloRating&sortOrder=desc

// Response
{
  players: Player[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

**Detail Endpoints** (e.g., `/api/players/[id]`):

```typescript
// Request
GET /api/players/{id}

// Response
{
  id: string,
  name: string,
  eloRating: number,
  // ... other fields
}
```

**Error Response**:

```typescript
{
  error: string,        // User-friendly message
  code: string,         // Error code
  message?: string,     // Technical message
  field?: string        // Field name for validation errors
}
```

### Authentication

**Methods**:

1. **Cookie-based**: `auth-token` cookie set by login
2. **NextAuth.js**: OAuth providers (Google, Discord, GitHub)
3. **Session**: Server-side session management

**Middleware**:

- `authenticateRequest()` - Validates authentication
- `requireRole(role)` - Enforces role requirements
- `withAdminAuth()` - Admin-only wrapper

**Authorization Levels**:

- **GUEST**: Public access
- **USER**: Authenticated users
- **ADMIN**: Administrative access
- **MODERATOR**: Moderator access

### Rate Limiting

**Implementation**: Redis-based rate limiter
**Configuration**: Per-endpoint limits
**Import Endpoints**: Stricter limits
**Auth Endpoints**: Standard limits

---

## Security Architecture

### Authentication

**NextAuth.js 4.24.12**:

- Session management
- OAuth providers (Google, Discord, GitHub)
- JWT tokens for API authentication
- Secure HTTP-only cookies

**Supabase Auth**:

- OAuth provider integration
- User management
- Session refresh

### Authorization

**Role-Based Access Control (RBAC)**:

- User roles: `guest`, `user`, `moderator`, `admin`
- Permission-based access control
- Route guards: `ProtectedRoute` component
- Component guards: `RoleGuard`, `PermissionGate`

**Permission System**:

- Permission model in database
- Resource-action permissions
- Dynamic permission checking

### API Security

**Rate Limiting**: Redis-based, configurable per endpoint
**CORS**: Configured in `vercel.json`
**Security Headers**: X-Frame-Options, X-XSS-Protection
**Input Validation**: Zod schemas for all inputs
**SQL Injection Protection**: Prisma ORM parameterized queries
**XSS Protection**: React automatic escaping, input sanitization

---

## Performance Considerations

### Caching Strategy

**Redis**:

- API response caching
- Session storage
- Rate limiting data

**TanStack Query**:

- Client-side caching
- Stale-while-revalidate pattern
- Background refetching

**Next.js**:

- ISR (Incremental Static Regeneration)
- Automatic code splitting
- Image optimization

**CDN**: Vercel Edge Network for static assets

### Database Optimization

**Connection Pooling**: PgBouncer recommended for production
**Indexes**: Foreign key indexes, composite indexes for common queries
**Query Optimization**: Prisma query optimization, selective field loading
**Batch Processing**: Batch operations for imports (100 records per batch)

### Build Optimization

**Code Splitting**: Automatic via Next.js
**Tree Shaking**: Unused code elimination
**Image Optimization**: Next.js Image component
**Minification**: Production builds minified

---

## Deployment Architecture

### Hosting

**Platform**: Vercel
**Deployment Type**: Serverless functions
**Edge Network**: Global CDN
**Automatic Deployments**: On push to main branch
**Preview Deployments**: For pull requests

### Database

**Provider**: Supabase (PostgreSQL)
**Connection**: Environment variables `DATABASE_URL` and `DIRECT_URL`
**Migrations**: Prisma migrations deployed via `yarn db:deploy`
**Backup**: Managed by Supabase

### Environment Variables

**Required**:

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (migrations)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `REDIS_URL` - Redis connection string

**OAuth Providers** (optional):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

---

## Development Environment

### Prerequisites

- **Node.js**: >=25.1.0
- **Package Manager**: Yarn
- **Database**: PostgreSQL (via Supabase)
- **Redis**: For caching and sessions
- **Git**: Version control

### Setup Commands

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Run database migrations
yarn db:migrate

# Seed database (optional)
yarn db:seed

# Start development server
yarn dev

# Run tests
yarn test

# Run E2E tests
yarn test:e2e

# Check architecture compliance
yarn test:arch

# Lint code
yarn lint

# Format code
yarn format
```

### Development Scripts

**Development**:

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server

**Code Quality**:

- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint issues
- `yarn format` - Format with Prettier
- `yarn type-check` - TypeScript type checking

**Testing**:

- `yarn test` - Run unit tests
- `yarn test:watch` - Watch mode
- `yarn test:coverage` - Coverage report
- `yarn test:e2e` - E2E tests
- `yarn test:arch` - Architecture validation

**Database**:

- `yarn db:generate` - Generate Prisma client
- `yarn db:migrate` - Run migrations
- `yarn db:deploy` - Deploy migrations
- `yarn db:seed` - Seed database
- `yarn db:studio` - Open Prisma Studio

---

## Architecture Decision Records (ADRs)

### ADR-001: Clean Architecture + Hexagonal Architecture

**Decision**: Use Clean Architecture with Hexagonal Architecture patterns

**Rationale**:

- Separation of concerns and testability
- Framework independence for domain layer
- Easy to swap implementations (ports and adapters)
- Long-term maintainability

**Consequences**:

- Clear layer boundaries
- Dependency inversion enforced
- More files but better organization
- Architecture validation via dependency-cruiser

---

### ADR-002: Next.js App Router

**Decision**: Use Next.js 16 App Router (not Pages Router)

**Rationale**:

- Modern React patterns (Server Components)
- Better performance (automatic code splitting)
- File-based routing
- Built-in optimizations

**Consequences**:

- Server Components by default
- API routes in `app/api/` directory
- Route groups for organization
- Learning curve for team

---

### ADR-003: Prisma ORM

**Decision**: Use Prisma 5.0.0 for database access

**Rationale**:

- Type-safe database access
- Excellent developer experience
- Migration management
- Active community

**Consequences**:

- Type safety from database to application
- Schema-first approach
- Migration files in `prisma/migrations/`
- Prisma Client generation required

---

### ADR-004: TanStack Query + Zustand

**Decision**: Hybrid state management approach

**Rationale**:

- TanStack Query for server state (caching, refetching)
- Zustand for client state (lightweight, simple)
- Best of both worlds
- Optimal performance

**Consequences**:

- Two state management libraries
- Clear separation: server vs client state
- TanStack Query handles API caching
- Zustand handles UI preferences

---

### ADR-005: ShadCN/UI Copy-Paste Model

**Decision**: Use ShadCN/UI with copy-paste components (not npm package)

**Rationale**:

- Full customization control
- No runtime dependencies
- Built on Radix UI (accessibility)
- Easy to modify components

**Consequences**:

- Components in `src/components/ui/`
- Manual updates when needed
- Full control over styling
- More code to maintain

---

### ADR-006: Monolithic Architecture

**Decision**: Single Next.js application (not microservices)

**Rationale**:

- Simpler deployment and operations
- Easier development and testing
- Lower operational complexity
- Sufficient for current scale

**Consequences**:

- Single codebase
- Single deployment
- Easier to reason about
- May need to split later if scale requires

---

### ADR-007: Zod for Validation

**Decision**: Use Zod 4.1.12 for all schema validation

**Rationale**:

- Type-safe validation
- Works with TypeScript
- Great developer experience
- Used throughout codebase consistently

**Consequences**:

- Consistent validation patterns
- Type inference from schemas
- Runtime and compile-time safety
- Single validation library

---

### ADR-008: Vercel Deployment

**Decision**: Deploy to Vercel

**Rationale**:

- Optimized for Next.js
- Automatic deployments
- Edge network for global CDN
- Easy environment variable management

**Consequences**:

- Serverless functions
- Automatic scaling
- Edge network benefits
- Vendor lock-in to Vercel

---

## Architecture Validation

### Automated Enforcement

**Dependency Cruiser**:

- Configuration: `config/architecture-rules.json`
- Command: `yarn test:arch`
- Rules: Enforce layer dependencies, prevent circular dependencies

**Architecture Rules**:

- Domain cannot import application/adapters/infrastructure
- Application cannot import adapters/infrastructure
- Core layers cannot import `src/lib` helpers directly
- Dependency arrows must point inward

### Manual Enforcement

- **Code Review**: Architecture compliance checks
- **Documentation**: Architecture decisions documented
- **Onboarding**: Architecture guidelines for new developers

---

## Failed Scraping Points Storage & Retry

### Overview

The architecture includes comprehensive failed scraping points storage and retry capability to ensure data import resilience. Failed scraping operations are automatically stored in the `SkippedEntity` model and can be retried either automatically or manually.

### Database Model

**SkippedEntity Model** (`prisma/schema.prisma`):

- `id` - UUID primary key
- `phase` - Import phase (CLUBS, PLAYERS, GAMES, etc.)
- `entityType` - Type of entity ('page', 'player', 'game', etc.)
- `entityId` - Entity identifier (gomafiaId or other)
- `pageNumber` - Page number if applicable
- `errorCode` - Error classification code (SCRAPE_ERROR, PAGE_SKIP, etc.)
- `errorMessage` - Human-readable error message
- `errorDetails` - JSON context (stack traces, request details)
- `retryCount` - Number of retry attempts
- `lastRetryAt` - Timestamp of last retry attempt
- `status` - Status (PENDING, RETRYING, COMPLETED, FAILED)
- `syncLogId` - Associated sync log ID
- `createdAt`, `updatedAt` - Timestamps

**Indexes**:

- `[phase, status]` - Fast lookup by phase and status
- `[entityType, entityId]` - Fast lookup by entity
- `[pageNumber]` - Fast lookup by page number

### Implementation

**SkippedEntitiesManager** (`src/lib/gomafia/import/skipped-entities-manager.ts`):

- `recordSkippedEntity()` - Store failed scraping point
- `getSkippedEntitiesByPhase()` - Retrieve by import phase
- `getSkippedEntitiesByPlayerId()` - Retrieve by player ID
- `getSkippedEntitiesByPage()` - Retrieve by page number
- `markAsRetrying()` - Update status to RETRYING
- `markAsCompleted()` - Mark retry as successful
- `markAsFailed()` - Mark retry as failed after max attempts
- `getSummary()` - Get summary statistics by phase
- `cleanupCompletedEntities()` - Clean up old completed entities

**Integration Points**:

- Import phases call `orchestrator.recordSkippedEntity()` on scraping failures
- Scrapers catch errors and record skipped entities before throwing
- Retry operations update entity status during retry lifecycle

### Retry Patterns

**Automatic Retry**:

- RetryManager with exponential backoff (1s, 2s, 4s)
- Maximum retry attempts: 3 (configurable)
- Transient vs permanent error detection
- Automatic status updates (PENDING → RETRYING → COMPLETED/FAILED)

**Manual Retry**:

- Admin UI: `SkippedEntitiesTable` component (`src/components/import/SkippedEntitiesTable.tsx`)
- Retry dialog: `RetryDialog` component for batch retry
- API endpoint: `/api/admin/import/retry` (if exists)
- Selective retry: Choose specific entities or phases to retry

### Error Classification

**Error Codes**:

- `SCRAPE_ERROR` - General scraping failure
- `PAGE_SKIP` - Page skipped during pagination
- `TIMEOUT_ERROR` - Scraping timeout
- `NETWORK_ERROR` - Network connectivity issues
- `PARSING_ERROR` - Data parsing failure
- `VALIDATION_ERROR` - Data validation failure

### Usage Pattern

```typescript
// Record failed scraping point
await orchestrator.recordSkippedEntity({
  phase: 'PLAYERS',
  entityType: 'page',
  pageNumber: 42,
  errorCode: 'SCRAPE_ERROR',
  errorMessage: 'Failed to scrape page 42: Timeout after 30s',
  errorDetails: {
    url: 'https://gomafia.pro/rating?page=42',
    timeout: 30000,
    stack: error.stack,
  },
});

// Retry failed entity
const skippedEntity = await skippedEntitiesManager.getSkippedEntitiesByPage(
  'PLAYERS',
  42
);
await skippedEntitiesManager.markAsRetrying(skippedEntity[0].id);
// ... perform retry operation ...
await skippedEntitiesManager.markAsCompleted(skippedEntity[0].id);
```

### UI Components

**SkippedEntitiesTable** (`src/components/import/SkippedEntitiesTable.tsx`):

- Displays all skipped entities with status badges
- Filter by phase, status, entity type
- Retry buttons for individual or batch operations
- Error details display for debugging
- Summary statistics by phase

**RetryDialog** (`src/components/import/RetryDialog.tsx`):

- Batch retry confirmation dialog
- Progress tracking during retry
- Success/failure feedback

### Best Practices

1. **Always record failures**: Every scraping failure should be recorded
2. **Include context**: Store error details, stack traces, and request context
3. **Classify errors**: Use consistent error codes for analysis
4. **Limit automatic retries**: Use exponential backoff and max retry limits
5. **Monitor retry success rate**: Track retry completion rates by error code
6. **Clean up old records**: Periodically clean up completed entities older than 30 days

---

## Architecture Analysis & Insights

### Pre-Mortem Analysis

**Hypothetical Failure Scenario**: Architecture fails to prevent AI agent conflicts, leading to inconsistent implementations.

**Contributing Factors**:

1. **Incomplete pattern documentation** - Missing edge cases in implementation patterns
2. **Ambiguous naming conventions** - Agents interpret patterns differently
3. **Layer boundary violations** - Agents bypass Clean Architecture rules
4. **Version drift** - Technology versions become outdated without verification
5. **Missing error handling patterns** - Inconsistent error handling across layers

**Warning Signs**:

- Multiple agents implementing same feature differently
- Code reviews finding pattern violations
- Tests failing due to inconsistent implementations
- Merge conflicts from different naming/styles

**Preventive Measures** (Already Implemented):

- ✅ Comprehensive implementation patterns documented
- ✅ Clear naming conventions with examples
- ✅ Architecture validation via dependency-cruiser
- ✅ Version verification process documented
- ✅ Error handling patterns with code examples

**Additional Recommendations**:

- Add pattern validation tests that check naming/structure compliance
- Create architecture decision review process for new patterns
- Document common anti-patterns to avoid
- Add automated pattern checking in CI/CD

### Devil's Advocate Challenges

**Challenge 1: Clean Architecture Overhead**

- **Opposition**: Clean Architecture adds unnecessary complexity for a simple analytics app
- **Counter-argument**: The architecture provides long-term maintainability and testability. The overhead is minimal compared to the benefits of clear boundaries and framework independence.
- **Resolution**: Documented in ADR-001. The benefits (testability, maintainability, framework independence) outweigh the complexity cost.

**Challenge 2: Monolithic Architecture Limitation**

- **Opposition**: Monolith will become a bottleneck as the platform scales
- **Counter-argument**: Current scale doesn't justify microservices complexity. Vercel auto-scaling handles load. Can split later if needed.
- **Resolution**: Documented in ADR-006. Migration path to microservices exists if scale requires.

**Challenge 3: Dual State Management Complexity**

- **Opposition**: Using both TanStack Query and Zustand adds cognitive load
- **Counter-argument**: Clear separation (server vs client state) reduces complexity. Each tool optimized for its use case.
- **Resolution**: Documented in ADR-004. Pattern is well-established and reduces complexity by using right tool for right job.

**Challenge 4: ShadCN/UI Copy-Paste Maintenance**

- **Opposition**: Manual component updates are error-prone and time-consuming
- **Counter-argument**: Full customization control enables project-specific needs. Updates are infrequent and controlled.
- **Resolution**: Documented in ADR-005. Trade-off between control and maintenance is acceptable for customization needs.

**Strengthened Decisions**: All ADRs validated through adversarial challenge. Architecture decisions are sound and well-reasoned.

### SWOT Analysis

**Strengths**:

- **Clean Architecture**: Clear separation of concerns, testability, framework independence
- **Comprehensive Patterns**: Detailed implementation patterns prevent agent conflicts
- **Type Safety**: TypeScript + Prisma + Zod provide end-to-end type safety
- **Modern Stack**: Next.js 16, React 19, latest tooling
- **Resilient Import**: Failed scraping points storage and retry capability
- **Automated Validation**: Dependency-cruiser enforces architecture rules

**Weaknesses**:

- **Monolithic**: May need refactoring if scale requires microservices
- **Vendor Lock-in**: Vercel deployment creates dependency
- **Manual Component Updates**: ShadCN/UI copy-paste requires manual maintenance
- **Learning Curve**: Clean Architecture requires team education
- **Single Database**: PostgreSQL may need scaling strategies as data grows

**Opportunities**:

- **Real-time Features**: Supabase Realtime for live updates
- **Edge Computing**: Vercel Edge Functions for global performance
- **Microservices Migration**: Clear path if scale requires
- **GraphQL API**: If API complexity increases
- **Event Sourcing**: For audit trails and complex workflows
- **CQRS**: Separate read/write models for performance

**Threats**:

- **gomafia.pro Changes**: Web scraping vulnerable to site structure changes
- **Rate Limiting**: External API rate limits may impact import performance
- **Technology Obsolescence**: Framework versions may become outdated
- **Team Knowledge**: Architecture complexity requires ongoing education
- **Scaling Costs**: Database and infrastructure costs may increase with growth

**Strategic Insights**:

- Strengths align with project goals (maintainability, consistency)
- Weaknesses are manageable and have mitigation paths
- Opportunities provide clear evolution paths
- Threats are external and have monitoring/mitigation strategies

### Red Team Analysis

**Adversarial Perspective**: Attack the architecture to find vulnerabilities and weaknesses.

**Attack Vector 1: Layer Boundary Violations**

- **Vulnerability**: Agents might bypass Clean Architecture by importing directly from `src/lib`
- **Exploitation**: Direct database access from components, skipping use cases
- **Countermeasure**: ✅ Dependency-cruiser rules prevent this. Documented in Architecture Validation section.

**Attack Vector 2: Inconsistent Error Handling**

- **Vulnerability**: Different error formats across layers confuse agents
- **Exploitation**: Agents implement different error handling patterns
- **Countermeasure**: ✅ Error handling patterns documented with code examples. Standardized error format defined.

**Attack Vector 3: Version Drift**

- **Vulnerability**: Technology versions become outdated, causing compatibility issues
- **Exploitation**: Agents use outdated patterns or incompatible versions
- **Countermeasure**: ✅ Version verification process documented. WebSearch required for version checks.

**Attack Vector 4: Pattern Ambiguity**

- **Vulnerability**: Vague patterns allow multiple interpretations
- **Exploitation**: Agents implement patterns differently
- **Countermeasure**: ✅ Patterns include concrete examples and code snippets. Naming conventions are explicit.

**Attack Vector 5: Failed Scraping Points Accumulation**

- **Vulnerability**: SkippedEntity table grows unbounded, impacting performance
- **Exploitation**: Database bloat from accumulated failed entities
- **Countermeasure**: ✅ Cleanup method exists (`cleanupCompletedEntities`). Should be scheduled via cron job.

**Attack Vector 6: Import Timeout Exploitation**

- **Vulnerability**: 12-hour timeout may be insufficient for large imports
- **Exploitation**: Long-running imports timeout before completion
- **Countermeasure**: ✅ Checkpoint system allows resume. Timeout is configurable.

**Vulnerabilities Found**: 1 critical (failed entities cleanup needs automation)
**Recommendations**:

- Add scheduled cleanup job for completed SkippedEntity records
- Monitor SkippedEntity table growth
- Add alerts for high failure rates

### First Principles Analysis

**Fundamental Truths**:

1. **AI agents need explicit, unambiguous patterns** - Agents cannot infer intent from vague descriptions
2. **Consistency prevents conflicts** - Standardized patterns reduce implementation variations
3. **Type safety catches errors early** - TypeScript + Prisma + Zod provide compile-time and runtime safety
4. **Separation of concerns enables testing** - Clean Architecture allows testing without external dependencies
5. **Framework independence enables evolution** - Domain layer can outlive framework choices

**Questioning Assumptions**:

**Assumption 1**: "Clean Architecture is necessary for this project"

- **Question**: Is the complexity justified for a simple analytics app?
- **Answer**: Yes - The project has 66 functional requirements, complex import logic, and needs long-term maintainability. The architecture provides value.

**Assumption 2**: "Monolithic architecture is sufficient"

- **Question**: Will this scale to thousands of users?
- **Answer**: Yes - Vercel auto-scaling, database connection pooling, and caching strategies support growth. Migration path exists if needed.

**Assumption 3**: "Web scraping is the right approach"

- **Question**: Should we use an API instead of scraping?
- **Answer**: No API available from gomafia.pro. Scraping is necessary. Resilience patterns (failed points storage, retry) mitigate risks.

**Assumption 4**: "Failed scraping points storage is sufficient"

- **Question**: Is manual retry enough, or do we need automatic retry?
- **Answer**: Both exist. Automatic retry handles transient failures. Manual retry handles permanent failures requiring investigation.

**Rebuilt Understanding**:

- Architecture serves as **consistency contract** for AI agents
- Patterns must be **explicit and unambiguous** with code examples
- Failed scraping resilience is **critical** for data import reliability
- Clean Architecture provides **long-term value** through maintainability
- Technology choices balance **simplicity and capability**

**Enhanced Insights**:

- Add automated cleanup for SkippedEntity records
- Consider scheduled automatic retry for PENDING entities
- Monitor retry success rates to identify systemic issues
- Document common failure patterns and resolutions

---

## Architecture Analysis & Insights

This section contains insights from advanced elicitation methods applied to strengthen the architecture document and identify potential improvements.

### Pre-Mortem Analysis

**Hypothetical Failure Scenario**: Architecture fails to prevent AI agent conflicts, leading to inconsistent implementations.

**Contributing Factors**:

1. **Incomplete pattern documentation** - Missing edge cases in implementation patterns
2. **Ambiguous naming conventions** - Agents interpret patterns differently
3. **Layer boundary violations** - Agents bypass Clean Architecture rules
4. **Version drift** - Technology versions become outdated without verification
5. **Missing error handling patterns** - Inconsistent error handling across layers

**Warning Signs**:

- Multiple agents implementing same feature differently
- Code reviews finding pattern violations
- Tests failing due to inconsistent implementations
- Merge conflicts from different naming/styles

**Preventive Measures** (Already Implemented):

- ✅ Comprehensive implementation patterns documented
- ✅ Clear naming conventions with examples
- ✅ Architecture validation via dependency-cruiser
- ✅ Version verification process documented
- ✅ Error handling patterns with code examples

**Additional Recommendations**:

- Add pattern validation tests that check naming/structure compliance
- Create architecture decision review process for new patterns
- Document common anti-patterns to avoid
- Add automated pattern checking in CI/CD

### Devil's Advocate Challenges

**Challenge 1: Clean Architecture Overhead**

- **Opposition**: Clean Architecture adds unnecessary complexity for a simple analytics app
- **Counter-argument**: The architecture provides long-term maintainability and testability. The overhead is minimal compared to the benefits of clear boundaries and framework independence.
- **Resolution**: Documented in ADR-001. The benefits (testability, maintainability, framework independence) outweigh the complexity cost.

**Challenge 2: Monolithic Architecture Limitation**

- **Opposition**: Monolith will become a bottleneck as the platform scales
- **Counter-argument**: Current scale doesn't justify microservices complexity. Vercel auto-scaling handles load. Can split later if needed.
- **Resolution**: Documented in ADR-006. Migration path to microservices exists if scale requires.

**Challenge 3: Dual State Management Complexity**

- **Opposition**: Using both TanStack Query and Zustand adds cognitive load
- **Counter-argument**: Clear separation (server vs client state) reduces complexity. Each tool optimized for its use case.
- **Resolution**: Documented in ADR-004. Pattern is well-established and reduces complexity by using right tool for right job.

**Challenge 4: ShadCN/UI Copy-Paste Maintenance**

- **Opposition**: Manual component updates are error-prone and time-consuming
- **Counter-argument**: Full customization control enables project-specific needs. Updates are infrequent and controlled.
- **Resolution**: Documented in ADR-005. Trade-off between control and maintenance is acceptable for customization needs.

**Strengthened Decisions**: All ADRs validated through adversarial challenge. Architecture decisions are sound and well-reasoned.

### SWOT Analysis

**Strengths**:

- **Clean Architecture**: Clear separation of concerns, testability, framework independence
- **Comprehensive Patterns**: Detailed implementation patterns prevent agent conflicts
- **Type Safety**: TypeScript + Prisma + Zod provide end-to-end type safety
- **Modern Stack**: Next.js 16, React 19, latest tooling
- **Resilient Import**: Failed scraping points storage and retry capability
- **Automated Validation**: Dependency-cruiser enforces architecture rules

**Weaknesses**:

- **Monolithic**: May need refactoring if scale requires microservices
- **Vendor Lock-in**: Vercel deployment creates dependency
- **Manual Component Updates**: ShadCN/UI copy-paste requires manual maintenance
- **Learning Curve**: Clean Architecture requires team education
- **Single Database**: PostgreSQL may need scaling strategies as data grows

**Opportunities**:

- **Real-time Features**: Supabase Realtime for live updates
- **Edge Computing**: Vercel Edge Functions for global performance
- **Microservices Migration**: Clear path if scale requires
- **GraphQL API**: If API complexity increases
- **Event Sourcing**: For audit trails and complex workflows
- **CQRS**: Separate read/write models for performance

**Threats**:

- **gomafia.pro Changes**: Web scraping vulnerable to site structure changes
- **Rate Limiting**: External API rate limits may impact import performance
- **Technology Obsolescence**: Framework versions may become outdated
- **Team Knowledge**: Architecture complexity requires ongoing education
- **Scaling Costs**: Database and infrastructure costs may increase with growth

**Strategic Insights**:

- Strengths align with project goals (maintainability, consistency)
- Weaknesses are manageable and have mitigation paths
- Opportunities provide clear evolution paths
- Threats are external and have monitoring/mitigation strategies

### Red Team Analysis

**Adversarial Perspective**: Attack the architecture to find vulnerabilities and weaknesses.

**Attack Vector 1: Layer Boundary Violations**

- **Vulnerability**: Agents might bypass Clean Architecture by importing directly from `src/lib`
- **Exploitation**: Direct database access from components, skipping use cases
- **Countermeasure**: ✅ Dependency-cruiser rules prevent this. Documented in Architecture Validation section.

**Attack Vector 2: Inconsistent Error Handling**

- **Vulnerability**: Different error formats across layers confuse agents
- **Exploitation**: Agents implement different error handling patterns
- **Countermeasure**: ✅ Error handling patterns documented with code examples. Standardized error format defined.

**Attack Vector 3: Version Drift**

- **Vulnerability**: Technology versions become outdated, causing compatibility issues
- **Exploitation**: Agents use outdated patterns or incompatible versions
- **Countermeasure**: ✅ Version verification process documented. WebSearch required for version checks.

**Attack Vector 4: Pattern Ambiguity**

- **Vulnerability**: Vague patterns allow multiple interpretations
- **Exploitation**: Agents implement patterns differently
- **Countermeasure**: ✅ Patterns include concrete examples and code snippets. Naming conventions are explicit.

**Attack Vector 5: Failed Scraping Points Accumulation**

- **Vulnerability**: SkippedEntity table grows unbounded, impacting performance
- **Exploitation**: Database bloat from accumulated failed entities
- **Countermeasure**: ✅ Cleanup method exists (`cleanupCompletedEntities`). **Recommendation**: Add scheduled cleanup job.

**Attack Vector 6: Import Timeout Exploitation**

- **Vulnerability**: 12-hour timeout may be insufficient for large imports
- **Exploitation**: Long-running imports timeout before completion
- **Countermeasure**: ✅ Checkpoint system allows resume. Timeout is configurable.

**Vulnerabilities Found**: 1 critical (failed entities cleanup needs automation)
**Recommendations**:

- Add scheduled cleanup job for completed SkippedEntity records (cron job)
- Monitor SkippedEntity table growth with alerts
- Add analytics dashboard for failure pattern analysis
- Consider automatic retry scheduling for PENDING entities

### First Principles Analysis

**Fundamental Truths**:

1. **AI agents need explicit, unambiguous patterns** - Agents cannot infer intent from vague descriptions
2. **Consistency prevents conflicts** - Standardized patterns reduce implementation variations
3. **Type safety catches errors early** - TypeScript + Prisma + Zod provide compile-time and runtime safety
4. **Separation of concerns enables testing** - Clean Architecture allows testing without external dependencies
5. **Framework independence enables evolution** - Domain layer can outlive framework choices
6. **Failed operation resilience is critical** - Data import must handle failures gracefully with retry capability

**Questioning Assumptions**:

**Assumption 1**: "Clean Architecture is necessary for this project"

- **Question**: Is the complexity justified for a simple analytics app?
- **Answer**: Yes - The project has 66 functional requirements, complex import logic, and needs long-term maintainability. The architecture provides value.

**Assumption 2**: "Monolithic architecture is sufficient"

- **Question**: Will this scale to thousands of users?
- **Answer**: Yes - Vercel auto-scaling, database connection pooling, and caching strategies support growth. Migration path exists if needed.

**Assumption 3**: "Web scraping is the right approach"

- **Question**: Should we use an API instead of scraping?
- **Answer**: No API available from gomafia.pro. Scraping is necessary. Resilience patterns (failed points storage, retry) mitigate risks.

**Assumption 4**: "Failed scraping points storage is sufficient"

- **Question**: Is manual retry enough, or do we need automatic retry?
- **Answer**: Both exist. Automatic retry handles transient failures. Manual retry handles permanent failures requiring investigation. **Enhancement**: Add scheduled automatic retry for PENDING entities.

**Rebuilt Understanding**:

- Architecture serves as **consistency contract** for AI agents
- Patterns must be **explicit and unambiguous** with code examples
- Failed scraping resilience is **critical** for data import reliability
- Clean Architecture provides **long-term value** through maintainability
- Technology choices balance **simplicity and capability**

**Enhanced Insights**:

- Add automated cleanup for SkippedEntity records (scheduled job)
- Consider scheduled automatic retry for PENDING entities (cron job)
- Monitor retry success rates to identify systemic issues (analytics dashboard)
- Document common failure patterns and resolutions (knowledge base)

---

## Future Considerations

### Potential Evolutions

1. **Microservices**: If scale requires, split into services
2. **Event Sourcing**: For audit trails and complex workflows
3. **CQRS**: Separate read/write models for performance
4. **GraphQL**: If API complexity increases
5. **Real-time Features**: Supabase Realtime for live updates
6. **Automated Retry Scheduling**: Cron job for automatic retry of PENDING SkippedEntity records
7. **Failed Entity Analytics**: Dashboard for analyzing failure patterns and success rates
8. **Scheduled Cleanup**: Automated cleanup job for completed SkippedEntity records older than 30 days

### Scalability

- **Horizontal Scaling**: Vercel auto-scaling
- **Database Scaling**: Read replicas, connection pooling
- **Caching**: Redis cluster for high availability
- **CDN**: Global edge network (Vercel)
- **Failed Entity Management**: Scheduled cleanup and retry automation

---

_Generated by BMAD Decision Architecture Workflow v1.0_  
_Date: 2025-12-02_  
_For: k05m0navt_  
_Enhanced with: Pre-mortem Analysis, Devil's Advocate, SWOT Analysis, Red Team Analysis, First Principles_
