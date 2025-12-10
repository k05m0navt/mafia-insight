# Source Tree Analysis

## Overview

The project contains **462 TypeScript/TSX files** organized in a clean architecture pattern with clear separation of concerns.

**Root Directory**: `src/`

---

## Directory Structure

```
src/
├── adapters/          # Adapter layer (controllers, gateways, presenters)
├── app/              # Next.js App Router (pages, API routes, layouts)
├── application/      # Application layer (use cases, contracts, ports)
├── components/       # React components (131 components)
├── domain/           # Domain layer (entities, services, value objects)
├── hooks/            # Custom React hooks (18 hooks)
├── infrastructure/   # Infrastructure layer (caching, messaging, persistence)
├── lib/              # Utility libraries and configurations (119 files)
├── services/         # Service layer (16 services)
├── store/            # Zustand state stores (2 stores)
├── types/            # TypeScript type definitions (8 files)
├── proxy.ts          # Proxy utility
└── stories/          # Storybook stories (if applicable)
```

---

## Layer Architecture

### 1. Adapters Layer

**Location**: `src/adapters/`

**Purpose**: Interface adapters connecting external world to application

**Structure**:

```
adapters/
├── controllers/      # HTTP controllers
│   ├── admin-controller.ts
│   ├── clubs-controller.ts
│   ├── players-controller.ts
│   ├── tournaments-controller.ts
│   └── internal-architecture-controller.ts
├── gateways/         # External service adapters
│   ├── admin-service.adapter.ts
│   ├── club-service.adapter.ts
│   ├── player-service.adapter.ts
│   └── tournament-service.adapter.ts
└── presenters/       # Data presentation layer
    └── player.presenter.ts
```

**Key Files**:

- Controllers handle HTTP requests/responses
- Gateways adapt external services to application contracts
- Presenters format data for API responses

---

### 2. Application Layer

**Location**: `src/application/`

**Purpose**: Application business logic and use cases

**Structure**:

```
application/
├── contracts/        # Application contracts/interfaces
│   ├── admin.ts
│   ├── architecture.ts
│   ├── clubs.ts
│   ├── players.ts
│   └── tournaments.ts
├── ports/            # Port interfaces (9 files)
├── use-cases/        # Business use cases (11 files)
├── errors.ts         # Application errors
└── index.ts
```

**Key Concepts**:

- **Contracts**: Define interfaces between layers
- **Ports**: Define input/output ports (hexagonal architecture)
- **Use Cases**: Business logic implementation
- **Errors**: Application-specific error types

---

### 3. Domain Layer

**Location**: `src/domain/`

**Purpose**: Core domain models and business rules

**Structure**:

```
domain/
├── entities/         # Domain entities (2 files)
├── services/         # Domain services (3 files)
├── value-objects/    # Value objects (1 file)
├── errors/           # Domain errors (4 files)
└── index.ts
```

**Key Concepts**:

- **Entities**: Core business objects
- **Services**: Domain-specific business logic
- **Value Objects**: Immutable value objects
- **Errors**: Domain-specific error types

---

### 4. Infrastructure Layer

**Location**: `src/infrastructure/`

**Purpose**: Technical infrastructure implementations

**Structure**:

```
infrastructure/
├── architecture/     # Architecture utilities (3 files)
├── caching/          # Caching implementations (2 files)
├── messaging/        # Messaging/events (2 files)
├── observability/    # Observability (1 file)
├── persistence/      # Persistence layer (2 files)
└── index.ts
```

**Key Features**:

- Caching strategies
- Message/event handling
- Observability (logging, metrics)
- Persistence abstractions

---

### 5. App Router (Next.js)

**Location**: `src/app/`

**Purpose**: Next.js App Router pages, API routes, and layouts

**Structure**:

```
app/
├── (auth)/           # Auth route group
│   ├── error/
│   ├── expired/
│   ├── login/
│   ├── network-error/
│   ├── signup/
│   └── unauthorized/
├── (dashboard)/      # Dashboard route group
│   ├── api-docs/
│   ├── clubs/
│   ├── games/
│   ├── import/
│   ├── players/
│   ├── presentation/
│   ├── settings/
│   ├── test-players/
│   ├── tournaments/
│   └── layout.tsx
├── access-denied/
├── admin/            # Admin pages
│   ├── bootstrap/
│   ├── dashboard/
│   ├── import/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── permissions/
│   ├── regions/
│   └── users/
├── api/              # API routes (62 route files)
│   ├── admin/        # Admin API endpoints
│   ├── analytics/    # Analytics endpoints
│   ├── auth/         # Authentication endpoints
│   ├── clubs/        # Clubs endpoints
│   ├── cron/         # Cron jobs
│   ├── games/        # Games endpoints
│   ├── gomafia-sync/ # Data sync endpoints
│   ├── import/       # Import progress endpoints
│   ├── navigation/   # Navigation endpoints
│   ├── notifications/
│   ├── players/      # Players endpoints
│   ├── profile/      # Profile endpoints
│   ├── regions/      # Regions endpoints
│   ├── search/       # Search endpoints
│   ├── test-db/      # Test endpoints (dev only)
│   ├── test-players/ # Test endpoints (dev only)
│   ├── theme/        # Theme endpoints
│   ├── tournaments/  # Tournaments endpoints
│   └── users/        # Users endpoints
├── api-docs/         # API documentation
│   ├── openapi.json/
│   └── swagger/
├── error.tsx          # Error boundary
├── favicon.ico
├── globals.css        # Global styles
├── internal/          # Internal routes
│   ├── architecture/
│   └── onboarding/
├── layout.tsx         # Root layout
├── offline/           # Offline page (PWA)
├── page.tsx           # Home page
├── profile/           # Profile page
└── pwa/               # PWA routes
    └── check-in/
```

**Key Features**:

- Route groups: `(auth)`, `(dashboard)` for layout organization
- API routes: RESTful endpoints in `api/` directory
- Server and client components
- Metadata and SEO configuration

---

### 6. Components

**Location**: `src/components/`

**Purpose**: React UI components (131 components)

**Structure**: See `component-inventory.md` for complete breakdown

**Organization**:

- `ui/` - Base UI components (ShadCN/UI)
- `auth/` - Authentication components
- `admin/` - Admin interface components
- `analytics/` - Analytics components
- `data-display/` - Data presentation components
- `import/` - Import interface components
- `sync/` - Sync components
- `navigation/` - Navigation components
- `layout/` - Layout components
- `profile/` - Profile components
- `protected/` - Access control components
- `providers/` - Context providers

---

### 7. Hooks

**Location**: `src/hooks/`

**Purpose**: Custom React hooks (18 hooks)

**Files**:

- `useAdminDashboard.ts` - Admin dashboard data
- `useApiCache.ts` - API caching utilities
- `useAuth.ts` - Authentication operations
- `useDebounce.ts` - Debounce utility
- `useGames.ts` - Games data fetching
- `useImportControls.ts` - Import controls
- `useImportStatus.ts` - Import status tracking
- `useImportTrigger.ts` - Import triggering
- `useMobileMenu.ts` - Mobile menu state
- `useNavigation.ts` - Navigation state
- `usePermissions.ts` - Permission checks
- `usePlayers.ts` - Players data fetching
- `useProfile.ts` - Profile management
- `useRole.ts` - Role management
- `useSession.ts` - Session management
- `useSyncStatus.ts` - Sync status
- `useTheme.ts` - Theme management
- `useUserManagement.ts` - User management (Admin)

---

### 8. Services

**Location**: `src/services/`

**Purpose**: Service layer implementations (16 services)

**Files**:

- `analyticsService.ts` - Analytics calculations
- `AuthService.ts` - Authentication service
- `clubService.ts` - Club operations
- `CrossBrowserService.ts` - Cross-browser compatibility
- `ErrorHandlingService.ts` - Error handling
- `gameService.ts` - Game operations
- `navigationService.ts` - Navigation logic
- `permissionService.ts` - Permission management
- `playerService.ts` - Player operations
- `RecoveryService.ts` - Error recovery
- `RegressionTestService.ts` - Regression testing
- `tournamentService.ts` - Tournament operations
- `validation-service.ts` - Data validation
- `sync/` - Sync services
  - `notificationService.ts`
  - `verificationService.ts`

---

### 9. Libraries

**Location**: `src/lib/`

**Purpose**: Utility libraries and configurations (119 files)

**Key Directories**:

```
lib/
├── admin/            # Admin utilities
├── analytics/        # Analytics utilities
├── apiAuth.ts        # API authentication
├── apiDocumentation.ts
├── auth/             # Authentication utilities
├── auth.ts           # Auth configuration
├── cache/            # Caching utilities
├── constants/        # Constants
├── db/               # Database utilities (6 files)
├── db.ts             # Database connection
├── db-resilient.ts   # Resilient database
├── db-test.ts        # Test database
├── email/            # Email utilities
├── errors.ts         # Error handling
├── errorTracking/   # Error tracking
├── export/           # Export utilities
├── forms/            # Form utilities
├── gomafia/          # GoMafia integration (43 files)
│   ├── api.ts
│   ├── import/      # Import orchestration
│   ├── parsers/      # Data parsers
│   ├── scrapers/     # Web scrapers
│   ├── syncService.ts
│   └── validators/   # Data validators
├── jobs/             # Background jobs (3 files)
├── monitoring/       # Monitoring utilities (3 files)
├── navigation.ts     # Navigation logic
├── notifications/   # Notifications
├── parsers/          # Data parsers (3 files)
├── performance.ts   # Performance utilities
├── permissions.ts    # Permission management
├── queryClient.ts    # TanStack Query client
├── rateLimiter.ts    # Rate limiting
├── realtime/         # Real-time utilities
├── redis/            # Redis client (3 files)
├── redis.ts          # Redis connection
├── regions.ts        # Region utilities
├── supabase/         # Supabase utilities (3 files)
├── supabase.ts       # Supabase client
├── test-db.ts        # Test database
├── theme.ts          # Theme utilities
├── types/            # Type definitions (3 files)
├── ui-tokens/        # UI design tokens
├── users/            # User utilities
├── utils.ts          # General utilities
├── utils/            # Utility functions (2 files)
├── validation.ts     # Validation utilities
└── validations/      # Validation schemas (3 files)
```

**Key Libraries**:

- **gomafia/** - Comprehensive GoMafia.pro integration (43 files)
  - Import orchestration
  - Web scraping with Playwright
  - Data parsing and validation
  - Sync management
- **db/** - Database utilities
- **auth/** - Authentication utilities
- **redis/** - Redis caching
- **supabase/** - Supabase integration

---

### 10. Store

**Location**: `src/store/`

**Purpose**: Zustand state stores (2 stores)

**Files**:

- `authStore.ts` - Authentication state
- `analyticsStore.ts` - Analytics filters state

---

### 11. Types

**Location**: `src/types/`

**Purpose**: TypeScript type definitions (8 files)

**Files**:

- `api.ts` - API types
- `auth.ts` - Authentication types
- `gomafia-entities.ts` - GoMafia entity types
- `importProgress.ts` - Import progress types
- `navigation.ts` - Navigation types
- `permissions.ts` - Permission types
- `search.ts` - Search types
- `theme.ts` - Theme types

---

## Entry Points

### Application Entry

- **Root Layout**: `src/app/layout.tsx`
- **Home Page**: `src/app/page.tsx`
- **Root Provider**: `src/components/providers/index.tsx`

### API Entry Points

- **API Routes**: `src/app/api/**/route.ts`
- **NextAuth**: `src/app/api/auth/[...nextauth]/route.ts`

### Database Entry

- **Prisma Client**: `src/lib/db.ts`
- **Schema**: `prisma/schema.prisma`

---

## Critical Directories

### 1. `src/app/api/` - API Routes

**62 route files** handling all backend functionality:

- RESTful endpoints
- Authentication/authorization
- Data import/sync
- Admin operations
- Analytics

### 2. `src/lib/gomafia/` - GoMafia Integration

**43 files** for external data integration:

- Web scraping (Playwright)
- Data parsing and validation
- Import orchestration
- Sync management
- Error handling and retry logic

### 3. `src/components/` - UI Components

**131 components** organized by feature:

- Base UI primitives
- Feature-specific components
- Layout and navigation
- Forms and data display

### 4. `src/application/` - Business Logic

**28 files** implementing use cases:

- Application contracts
- Use case implementations
- Port interfaces
- Error handling

### 5. `src/adapters/` - Adapters

**14 files** connecting layers:

- HTTP controllers
- Service gateways
- Data presenters

---

## File Organization Patterns

### 1. Feature-Based Organization

Components and services organized by feature:

- `auth/` - Authentication features
- `admin/` - Admin features
- `analytics/` - Analytics features
- `import/` - Import features

### 2. Layer-Based Organization

Clear separation of concerns:

- `domain/` - Domain logic
- `application/` - Application logic
- `adapters/` - Interface adapters
- `infrastructure/` - Technical infrastructure

### 3. Type-Based Organization

Files organized by type:

- `components/` - React components
- `hooks/` - React hooks
- `services/` - Service classes
- `lib/` - Utility functions

---

## Integration Points

### External Services

- **Supabase**: Authentication, database, real-time
- **Redis**: Caching, sessions
- **GoMafia.pro**: Data source (web scraping)
- **NextAuth.js**: OAuth providers

### Internal Integration

- **API Routes** ↔ **Controllers** ↔ **Use Cases** ↔ **Domain**
- **Components** ↔ **Hooks** ↔ **Services** ↔ **API Routes**
- **State Management** ↔ **Components** ↔ **API Routes**

---

## Code Statistics

- **Total TypeScript/TSX Files**: 462
- **Components**: 131
- **API Routes**: 62
- **Hooks**: 18
- **Services**: 16
- **Adapters**: 14
- **Use Cases**: 11
- **Domain Entities**: 2
- **State Stores**: 2

---

## Architecture Patterns

### 1. Clean Architecture

- **Domain Layer**: Core business logic
- **Application Layer**: Use cases and contracts
- **Adapters Layer**: Interface adapters
- **Infrastructure Layer**: Technical implementations

### 2. Hexagonal Architecture

- **Ports**: Define interfaces (application/ports/)
- **Adapters**: Implement ports (adapters/gateways/)

### 3. Layered Architecture

- Clear separation between presentation, business, and data layers
- Dependency inversion principle

### 4. Component-Based Architecture

- Reusable React components
- Composition over inheritance
- Props-based communication

---

## Key Design Decisions

1. **Next.js App Router**: Modern routing with layouts and route groups
2. **Clean Architecture**: Separation of concerns with clear boundaries
3. **TypeScript**: Full type safety across all layers
4. **Prisma ORM**: Type-safe database access
5. **TanStack Query**: Server state management
6. **Zustand**: Lightweight client state
7. **ShadCN/UI**: Accessible component library
8. **Playwright**: Web scraping for data import

---

## Entry Point Analysis

### Main Application Flow

1. **Root Layout** (`app/layout.tsx`) → Wraps all pages
2. **Providers** (`components/providers/`) → Context providers
3. **Layout Component** (`components/layout/Layout.tsx`) → Main layout
4. **Pages** (`app/**/page.tsx`) → Route pages
5. **API Routes** (`app/api/**/route.ts`) → Backend endpoints

### Data Flow

1. **User Action** → Component
2. **Component** → Hook or Service
3. **Hook/Service** → API Route
4. **API Route** → Controller
5. **Controller** → Use Case
6. **Use Case** → Domain Service
7. **Domain Service** → Repository/Adapter
8. **Repository** → Database

---

## Critical Files

### Configuration

- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema

### Entry Points

- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/lib/db.ts` - Database connection
- `src/lib/queryClient.ts` - React Query client

### Core Services

- `src/lib/gomafia/import/import-orchestrator.ts` - Import orchestration
- `src/services/AuthService.ts` - Authentication
- `src/store/authStore.ts` - Auth state management

---

## Build Output

### Next.js Build

- `.next/` - Build output (excluded from source)
- Static assets in `public/`
- Server components and API routes compiled

### TypeScript

- `tsconfig.tsbuildinfo` - TypeScript build cache
- Type checking across all files

---

## Testing Structure

**Location**: `tests/`

- **Unit Tests**: `tests/unit/`
- **Integration Tests**: `tests/integration/`
- **E2E Tests**: `tests/e2e/`
- **Component Tests**: `tests/components/`
- **Test Utilities**: `tests/utils/`
- **Fixtures**: `tests/fixtures/`

---

## Source Tree Summary

```
src/
├── adapters/          (14 files)   - Interface adapters
├── app/              (105 files)   - Next.js App Router
│   ├── api/          (62 routes)   - API endpoints
│   └── pages/        (38 pages)    - Application pages
├── application/      (28 files)    - Application layer
├── components/       (131 files)   - React components
├── domain/           (11 files)    - Domain layer
├── hooks/            (18 files)    - Custom hooks
├── infrastructure/  (11 files)    - Infrastructure
├── lib/              (119 files)   - Utilities
├── services/         (16 files)    - Services
├── store/            (2 files)      - State stores
└── types/            (8 files)      - Type definitions

Total: 462 TypeScript/TSX files
```

Generated: 2025-11-22T17:39:05.300Z
