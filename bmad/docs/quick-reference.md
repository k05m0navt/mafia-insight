# Quick Reference Guide

## Project Overview

**Name**: Mafia Insight  
**Type**: Next.js Web Application (Monolith)  
**Framework**: Next.js 16 with App Router  
**Language**: TypeScript 5.0.0  
**Database**: PostgreSQL via Supabase  
**ORM**: Prisma 5.0.0

---

## Key Directories

```
src/
├── app/              # Next.js App Router (pages, API routes)
├── components/       # React components (131 components)
├── lib/              # Utilities (119 files)
├── application/      # Application layer (use cases)
├── domain/           # Domain layer (entities, services)
├── adapters/         # Adapters layer (controllers, gateways)
├── infrastructure/   # Infrastructure layer
├── hooks/            # Custom React hooks (18 hooks)
├── services/         # Service layer (16 services)
└── store/            # Zustand stores (2 stores)
```

---

## Quick Commands

### Development

```bash
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server
```

### Testing

```bash
yarn test             # Run all tests
yarn test:unit         # Unit tests only
yarn test:e2e          # E2E tests
yarn test:arch         # Architecture checks
```

### Database

```bash
yarn db:generate      # Generate Prisma Client
yarn db:migrate       # Run migrations
yarn db:studio        # Open Prisma Studio
```

### Code Quality

```bash
yarn lint             # Lint code
yarn type-check       # TypeScript check
yarn format           # Format code
```

---

## Key Files

### Configuration

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema
- `vercel.json` - Vercel deployment configuration

### Entry Points

- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/lib/db.ts` - Database connection
- `src/lib/queryClient.ts` - React Query client

### Core Services

- `src/lib/gomafia/import/import-orchestrator.ts` - Import orchestration
- `src/services/AuthService.ts` - Authentication
- `src/store/authStore.ts` - Auth state

---

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Players

- `GET /api/players` - List players (paginated)
- `GET /api/players/[id]` - Get player by ID

### Games

- `GET /api/games` - List games (paginated)
- `GET /api/games/[id]` - Get game by ID

### Tournaments

- `GET /api/tournaments` - List tournaments
- `GET /api/tournaments/[id]` - Get tournament by ID

### Admin

- `GET /api/admin/dashboard` - Admin dashboard metrics
- `POST /api/admin/bootstrap` - Create first admin

### Import/Sync

- `GET /api/gomafia-sync/import` - Get import status
- `POST /api/gomafia-sync/import` - Trigger import
- `DELETE /api/gomafia-sync/import` - Cancel import

**See**: `api-contracts.md` for complete API documentation

---

## Database Models

### Core Entities

- `User` - Platform users
- `Player` - Game players
- `Club` - Gaming teams
- `Game` - Game instances
- `Tournament` - Competitive events

### Supporting Entities

- `SyncStatus` - Import/sync status
- `SyncLog` - Sync operation logs
- `Analytics` - Pre-computed analytics

**See**: `data-models.md` for complete schema documentation

---

## State Management

### Server State

- **TanStack Query**: API data fetching
- **Location**: `src/lib/queryClient.ts`

### Client State

- **Zustand**: Authentication, analytics filters
- **Location**: `src/store/`

### Component State

- **React useState**: Local component state

**See**: `state-management.md` for complete documentation

---

## Component Categories

- **UI Components** (38): Base ShadCN/UI components
- **Auth Components** (25): Authentication and authorization
- **Admin Components** (16): Administrative interface
- **Analytics Components** (11): Analytics and statistics
- **Data Display** (8): Data presentation components
- **Sync/Import** (14): Data synchronization components

**See**: `component-inventory.md` for complete list

---

## Architecture Layers

1. **Domain Layer** (`src/domain/`) - Business logic
2. **Application Layer** (`src/application/`) - Use cases
3. **Adapters Layer** (`src/adapters/`) - Interface adapters
4. **Infrastructure Layer** (`src/infrastructure/`) - Technical implementations
5. **Presentation Layer** (`src/app/`, `src/components/`) - UI

**See**: `architecture.md` for complete architecture documentation

---

## Environment Variables

### Required

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### Optional

```env
GOOGLE_CLIENT_ID="..."
DISCORD_CLIENT_ID="..."
GITHUB_CLIENT_ID="..."
SENTRY_DSN="..."
```

**See**: `development-operations.md` for complete setup

---

## Common Tasks

### Create New Feature

1. Create use case in `src/application/use-cases/`
2. Create controller in `src/adapters/controllers/`
3. Create API route in `src/app/api/`
4. Create component in `src/components/`
5. Add tests in `tests/`

### Add New Database Model

1. Update `prisma/schema.prisma`
2. Run `yarn db:migrate`
3. Generate Prisma Client: `yarn db:generate`
4. Create repository in `src/infrastructure/persistence/`

### Add New API Endpoint

1. Create route file: `src/app/api/[resource]/route.ts`
2. Add controller: `src/adapters/controllers/[resource]-controller.ts`
3. Add use case: `src/application/use-cases/[resource]-use-case.ts`
4. Document in `api-contracts.md`

---

## Troubleshooting

### Database Connection

```bash
# Check connection
yarn db:studio

# Reset database
yarn db:reset
```

### Build Issues

```bash
# Clear build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules && yarn install
```

### Type Errors

```bash
# Type check
yarn type-check

# Regenerate Prisma Client
yarn db:generate
```

---

## Documentation Index

- **Project Structure**: `project-structure.md`
- **Technology Stack**: `technology-stack.md`
- **API Contracts**: `api-contracts.md`
- **Data Models**: `data-models.md`
- **State Management**: `state-management.md`
- **Component Inventory**: `component-inventory.md`
- **Source Tree**: `source-tree-analysis.md`
- **Architecture**: `architecture.md`
- **Development Guide**: `development-operations.md`
- **Existing Docs**: `existing-documentation-inventory.md`

---

## External Resources

- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **TanStack Query**: https://tanstack.com/query
- **ShadCN/UI**: https://ui.shadcn.com

---

Generated: 2025-11-22T17:54:25.300Z
