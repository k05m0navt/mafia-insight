# Technology Stack Analysis

## Project Type

**Web Application** - Next.js monolith with full-stack capabilities

## Technology Stack Summary

### Frontend Framework

- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.0.0** - Type-safe development

### Styling & UI

- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **ShadCN/UI** - Component library (built on Radix UI)
- **Radix UI** - Headless UI primitives for accessibility
  - @radix-ui/react-alert-dialog
  - @radix-ui/react-avatar
  - @radix-ui/react-checkbox
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-icons
  - @radix-ui/react-label
  - @radix-ui/react-navigation-menu
  - @radix-ui/react-popover
  - @radix-ui/react-progress
  - @radix-ui/react-radio-group
  - @radix-ui/react-scroll-area
  - @radix-ui/react-select
  - @radix-ui/react-separator
  - @radix-ui/react-slot
  - @radix-ui/react-switch
  - @radix-ui/react-tabs
  - @radix-ui/react-toast
  - @radix-ui/react-visually-hidden
- **Lucide React 0.548.0** - Icon library

### State Management

- **TanStack Query 5.0.0** - Server state management (React Query)
- **Zustand 4.4.0** - Client state management
- **React Hook Form 7.65.0** - Form state management
- **@hookform/resolvers 5.2.2** - Form validation resolvers

### Backend & API

- **Next.js API Routes** - Backend API (App Router)
- **Supabase 2.38.0** - Backend-as-a-Service
  - @supabase/ssr 0.1.0 - Server-side rendering support
  - @supabase/supabase-js 2.38.0 - Supabase client
- **NextAuth.js 4.24.12** - Authentication
  - @next-auth/supabase-adapter 0.2.1 - Supabase adapter
- **Redis 4.6.0** - Caching and session storage

### Database & ORM

- **PostgreSQL** - Primary database (via Supabase)
- **Prisma 5.0.0** - Database ORM and toolkit
  - @prisma/client 5.0.0 - Prisma client

### Validation & Schemas

- **Zod 4.1.12** - Schema validation
- **class-variance-authority 0.7.1** - Component variant utilities

### Utilities

- **date-fns 4.1.0** - Date manipulation
- **clsx 2.1.1** - Conditional class names
- **tailwind-merge 3.3.1** - Tailwind class merging
- **jsdom 23.0.0** - DOM implementation for Node.js
- **cron 3.1.0** - Cron job scheduling
- **resend 6.3.0** - Email API

### Testing

- **Vitest 1.0.0** - Unit and integration testing
  - @vitest/coverage-v8 1.6.1 - Code coverage
- **Playwright 1.56.1** - End-to-end testing
  - @playwright/test 1.56.1 - Playwright test framework
  - @axe-core/playwright 4.11.0 - Accessibility testing
- **React Testing Library 16.0.0** - Component testing
  - @testing-library/react 16.0.0
  - @testing-library/jest-dom 6.0.0
  - @testing-library/user-event 14.6.1
  - @testing-library/dom 10.4.1
- **Jest 29.0.0** - Test runner (legacy)
  - jest-environment-jsdom 29.0.0

### Development Tools

- **TypeScript 5.0.0** - Type checking
- **ESLint 9.0.0** - Code linting
  - @typescript-eslint/eslint-plugin 8.46.2
  - @typescript-eslint/parser 8.46.2
  - eslint-config-next 16.0.0
  - eslint-plugin-react-hooks 7.0.1
- **Prettier 3.0.0** - Code formatting
- **Husky 9.1.7** - Git hooks
- **lint-staged 16.2.6** - Pre-commit linting

### Build & Deployment

- **PostCSS 8.4.0** - CSS processing
- **Autoprefixer 10.4.0** - CSS vendor prefixing
- **tailwindcss-animate 1.0.7** - Tailwind animations
- **tsx 4.19.1** - TypeScript execution

### Monitoring & Observability

- **@sentry/nextjs 10.22.0** - Error tracking and performance monitoring
- **web-vitals 5.1.0** - Core Web Vitals tracking
- **@opentelemetry/api 1.9.0** - OpenTelemetry API
  - @opentelemetry/context-async-hooks 1.30.1
  - @opentelemetry/core 1.30.1
  - @opentelemetry/instrumentation 0.57.1
  - @opentelemetry/sdk-trace-base 1.30.1

### Code Quality & Analysis

- **dependency-cruiser 16.6.0** - Dependency analysis
- **jscpd 4.0.5** - Code duplication detection
- **lighthouse 13.1.0** - Performance auditing
- **canvas 3.2.0** - Canvas API (for testing/analysis)

### Documentation & API

- **next-swagger-doc 0.4.1** - OpenAPI/Swagger documentation
- **openapi-types 7.0.0** - OpenAPI type definitions

### Testing Utilities

- **@faker-js/faker 10.1.0** - Test data generation
- **node-mocks-http 1.17.2** - HTTP mocking for tests

### Type Definitions

- **@types/node 20.0.0** - Node.js types
- **@types/react 19.0.0** - React types
- **@types/react-dom 19.0.0** - React DOM types
- **@types/jsdom 21.0.0** - jsdom types

## Architecture Pattern

**Component-Based Layered Architecture**

- **Presentation Layer**: React components (Next.js App Router)
- **Application Layer**: Business logic and use cases
- **Domain Layer**: Domain models and entities
- **Infrastructure Layer**: External services, database, APIs
- **Adapters Layer**: External integrations

## Runtime Environment

- **Node.js**: >=25.1.0
- **Package Manager**: Yarn
- **Module System**: ES Modules (type: "module")

## Deployment Target

- **Hosting**: Vercel (assumed based on vercel.json presence)
- **Database**: Supabase PostgreSQL
- **CDN**: Vercel Edge Network
- **CI/CD**: GitHub Actions (assumed)

## Key Technology Decisions

1. **Next.js App Router**: Modern Next.js routing for better performance and developer experience
2. **TypeScript**: Full type safety across the application
3. **Prisma + Supabase**: Type-safe database access with BaaS features
4. **Radix UI + ShadCN**: Accessible, customizable component library
5. **TanStack Query**: Efficient server state management with caching
6. **Vitest + Playwright**: Comprehensive testing strategy
7. **Sentry**: Production error tracking and monitoring

## Technology Stack Table

| Category     | Technology           | Version | Purpose                    |
| ------------ | -------------------- | ------- | -------------------------- |
| Framework    | Next.js              | 16.0.0  | Full-stack React framework |
| Language     | TypeScript           | 5.0.0   | Type-safe development      |
| UI Library   | React                | 19.2.0  | Component framework        |
| Styling      | Tailwind CSS         | 3.3.0   | Utility-first CSS          |
| Components   | ShadCN/UI + Radix UI | Latest  | Accessible components      |
| Server State | TanStack Query       | 5.0.0   | Server state management    |
| Client State | Zustand              | 4.4.0   | Global state               |
| Database     | PostgreSQL           | Latest  | Primary database           |
| ORM          | Prisma               | 5.0.0   | Database toolkit           |
| Backend      | Supabase             | 2.38.0  | BaaS platform              |
| Auth         | NextAuth.js          | 4.24.12 | Authentication             |
| Cache        | Redis                | 4.6.0   | Caching and sessions       |
| Validation   | Zod                  | 4.1.12  | Schema validation          |
| Testing      | Vitest               | 1.0.0   | Unit/integration tests     |
| E2E Testing  | Playwright           | 1.56.1  | End-to-end tests           |
| Linting      | ESLint               | 9.0.0   | Code linting               |
| Formatting   | Prettier             | 3.0.0   | Code formatting            |
| Monitoring   | Sentry               | 10.22.0 | Error tracking             |

Generated: 2025-11-22T15:52:49.300Z
