# Development & Operations Guide

## Prerequisites

### Required Software

- **Node.js**: >= 25.1.0 (specified in `package.json` engines)
- **Yarn**: Package manager (lockfile: `yarn.lock`)
- **PostgreSQL**: Database server
- **Redis**: Caching and session storage
- **Git**: Version control

### Required Accounts/Services

- **Supabase Account**: Authentication and database
- **Vercel Account**: Deployment platform (optional for local dev)
- **Redis Instance**: Local or cloud (Upstash, Redis Cloud)

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/mafia-insight.git
cd mafia-insight
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local
```

**Required Environment Variables** (`.env.local`):

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mafia_insight"
DIRECT_URL="postgresql://username:password@localhost:5432/mafia_insight"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# External APIs
GOMAFIA_BASE_URL="https://gomafia.pro"

# Monitoring (optional)
SENTRY_DSN="your-sentry-dsn"
GOOGLE_ANALYTICS_ID="your-ga-id"

# Cron Jobs (production)
CRON_SECRET="your-32-byte-hex-secret"  # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup

```bash
# Generate Prisma Client
yarn db:generate

# Run database migrations
yarn db:migrate

# Seed the database (optional)
yarn db:seed
```

### 5. Create First Admin User

**Option A: Web Interface**

```bash
# Start development server
yarn dev
```

Visit [http://localhost:3000/admin/bootstrap](http://localhost:3000/admin/bootstrap)

**Option B: Command Line**

```bash
node scripts/create-first-admin.js admin@example.com "Admin User"
```

### 6. Start Development Server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Development Scripts

### Core Commands

```bash
# Development
yarn dev              # Start development server (port 3000)
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn lint:fix          # Fix ESLint errors
yarn type-check       # TypeScript type checking
yarn format            # Format code with Prettier

# Testing
yarn test              # Run all tests (Vitest)
yarn test:watch        # Run tests in watch mode
yarn test:unit         # Run unit tests only
yarn test:integration  # Run integration tests
yarn test:component    # Run component tests
yarn test:e2e          # Run E2E tests (Playwright)
yarn test:coverage     # Generate test coverage
yarn test:arch         # Architecture guardrails (dependency-cruiser)

# Database
yarn db:generate      # Generate Prisma Client
yarn db:migrate       # Run migrations (dev)
yarn db:deploy        # Deploy migrations (production)
yarn db:seed          # Seed database
yarn db:reset         # Reset database
yarn db:studio        # Open Prisma Studio

# Architecture
yarn arch:map         # Generate architecture map
```

---

## Build Process

### Production Build

```bash
yarn build
```

**Build Output**:

- `.next/` - Next.js build output
- Static assets optimized
- Server components compiled
- API routes compiled

**Build Configuration**:

- Framework: Next.js (auto-detected)
- Build Command: `yarn build`
- Output Directory: `.next`
- Install Command: `yarn install`

### Build Verification

```bash
# Type check
yarn type-check

# Lint check
yarn lint

# Test suite
yarn test:all
```

---

## Testing

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests (Playwright)
├── components/       # Component tests
├── performance/      # Performance tests
├── security/         # Security tests
├── fixtures/         # Test fixtures
└── utils/            # Test utilities
```

### Running Tests

```bash
# All tests
yarn test

# Specific test suites
yarn test:unit
yarn test:integration
yarn test:component
yarn test:e2e

# Watch mode
yarn test:watch

# Coverage
yarn test:coverage
yarn test:coverage:ui
```

### E2E Testing (Playwright)

```bash
# Run E2E tests
yarn test:e2e

# Quick E2E tests
yarn test:e2e:quick

# Interactive UI mode
yarn test:e2e:ui
```

**Playwright Configuration**:

- Config: `playwright.config.ts`
- Quick Config: `playwright.quick.config.ts`
- Browsers: Chromium, Firefox, WebKit

---

## Database Management

### Prisma ORM

**Schema Location**: `prisma/schema.prisma`

**Migrations**:

```bash
# Create migration
yarn prisma migrate dev --name migration_name

# Apply migrations (production)
yarn db:deploy

# Reset database
yarn db:reset
```

**Prisma Studio**:

```bash
yarn db:studio
```

Opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Database Schema

**Main Entities**:

- `User` - Platform users
- `Player` - Game players
- `Club` - Gaming teams
- `Game` - Game instances
- `Tournament` - Competitive events
- `SyncStatus` - Import/sync status
- `SyncLog` - Sync operation logs
- `Analytics` - Pre-computed analytics

**Performance Optimizations**:

- Foreign key indexes
- Composite indexes for common queries
- Connection pooling (PgBouncer recommended)

---

## Redis Setup

### Local Redis

**macOS**:

```bash
brew install redis
redis-server
```

**Docker**:

```bash
docker run -d -p 6379:6379 redis:alpine
```

### Cloud Redis (Recommended)

- **Upstash Redis**: Serverless Redis
- **Redis Cloud**: Managed Redis
- Update `REDIS_URL` in environment variables

---

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes
# ...

# Run tests
yarn test

# Type check
yarn type-check

# Lint
yarn lint

# Commit
git commit -m "feat: add feature"
```

### 2. Code Quality Checks

```bash
# Pre-commit (Husky hooks)
# Automatically runs:
# - ESLint
# - TypeScript check
# - Tests (if configured)

# Manual checks
yarn lint
yarn type-check
yarn test:arch
```

### 3. Architecture Validation

```bash
# Check architecture rules
yarn test:arch

# Generate architecture map
yarn arch:map
```

**Architecture Rules**: `config/architecture-rules.json`

---

## Deployment

### Vercel Deployment

**Configuration**: `vercel.json`

**Deployment Steps**:

1. **Connect Repository**
   - Vercel Dashboard → Add New Project
   - Import GitHub repository

2. **Configure Environment Variables**
   - Set all required variables in Vercel dashboard
   - Production, Preview, Development scopes

3. **Deploy**
   ```bash
   vercel --prod
   ```
   Or push to `main` branch (auto-deploy)

**Vercel Configuration**:

- Framework: Next.js
- Build Command: `yarn build`
- Output Directory: `.next`
- Install Command: `yarn install`
- Node Version: 25.1.0

**Cron Jobs** (configured in `vercel.json`):

- Daily Sync: `0 2 * * *` → `/api/cron/daily-sync`
- Data Sync: `0 */6 * * *` → `/api/cron/sync-data`
- Cache Cleanup: `0 2 * * *` → `/api/cron/cleanup-cache`

**Function Configuration**:

- API Routes: Max duration 30 seconds
- Serverless functions with auto-scaling

**Security Headers**:

- CORS headers for API routes
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Content-Type-Options: nosniff

**See**: `docs/deployment/VERCEL-SETUP.md` for detailed deployment guide

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Preview (Vercel)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-git-branch.vercel.app
```

---

## Monitoring & Observability

### Error Tracking

**Sentry Integration** (optional):

```env
SENTRY_DSN="your-sentry-dsn"
```

### Analytics

**Google Analytics** (optional):

```env
GOOGLE_ANALYTICS_ID="your-ga-id"
```

### Logging

- **Vercel Logs**: Real-time logs in Vercel dashboard
- **Console Logging**: Structured logging in code
- **Error Logging**: Error tracking with Sentry

---

## Performance Optimization

### Build Optimizations

- **Next.js Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Tree Shaking**: Unused code elimination
- **Minification**: Production builds minified

### Runtime Optimizations

- **Caching**: Redis for API responses
- **Database Connection Pooling**: PgBouncer recommended
- **CDN**: Vercel Edge Network
- **Static Generation**: ISR for static pages

---

## Troubleshooting

### Common Issues

**1. Prisma Client Not Generated**

```bash
yarn db:generate
```

**2. Database Connection Error**

- Verify `DATABASE_URL` is correct
- Check database is running
- Verify network access

**3. Redis Connection Error**

- Verify `REDIS_URL` is correct
- Check Redis server is running
- Test connection: `redis-cli ping`

**4. Build Failures**

- Check Node.js version: `node --version` (must be >= 25.1.0)
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && yarn install`

**5. TypeScript Errors**

```bash
yarn type-check
# Fix errors or check tsconfig.json
```

**6. Import Failures**

- Check Playwright browsers installed: `npx playwright install`
- Verify network access to gomafia.pro
- Check rate limiting (30 req/min)

---

## CI/CD Pipeline

**GitHub Actions**: `.github/workflows/ci.yml`

**CI Steps**:

1. Checkout repository
2. Setup Node.js 25.1.0
3. Install dependencies (`yarn install --frozen-lockfile`)
4. Install Playwright browsers
5. Lint (`yarn lint`)
6. Type check (`yarn type-check`)
7. Unit tests (`yarn test:unit`)
8. Architecture guardrails (`yarn test:arch`)

**Triggers**:

- Push to `main`, `develop`, `feature/**`
- Pull requests

---

## Security

### Environment Variables

- **Never commit** `.env.local` or `.env`
- Use Vercel environment variables for production
- Rotate secrets regularly

### Authentication

- **NextAuth.js**: Secure session management
- **Supabase Auth**: OAuth providers
- **JWT Tokens**: Secure token handling

### API Security

- **Rate Limiting**: Redis-based rate limiting
- **CORS**: Configured in `vercel.json`
- **Security Headers**: X-Frame-Options, X-XSS-Protection
- **Input Validation**: Zod schemas

---

## Backup & Recovery

### Database Backups

- **Automated Backups**: Configure in database provider
- **Manual Backup**: `pg_dump` or Prisma Studio export
- **Restore**: `pg_restore` or Prisma migrations

### Data Export

- **Prisma Studio**: Export data via UI
- **API Endpoints**: Export endpoints (if implemented)
- **Database Tools**: Direct database access

---

## Scaling Considerations

### Horizontal Scaling

- **Vercel**: Automatic scaling
- **Database**: Connection pooling (PgBouncer)
- **Redis**: Cluster mode for high availability

### Vertical Scaling

- **Vercel Pro**: Increased function timeout (60s)
- **Database**: Upgrade database tier
- **Redis**: Upgrade Redis instance

### Performance Monitoring

- **Vercel Analytics**: Performance metrics
- **Web Vitals**: Core Web Vitals tracking
- **Database Monitoring**: Query performance
- **Redis Monitoring**: Cache hit rates

---

## Maintenance

### Regular Tasks

1. **Dependency Updates**

   ```bash
   yarn upgrade
   ```

2. **Database Migrations**

   ```bash
   yarn db:migrate
   ```

3. **Prisma Client Regeneration**

   ```bash
   yarn db:generate
   ```

4. **Test Suite**

   ```bash
   yarn test:all
   ```

5. **Lint & Format**
   ```bash
   yarn lint:fix
   yarn format
   ```

### Health Checks

- **API Health**: `/api/health` endpoint
- **Database**: Connection test
- **Redis**: Connection test
- **Import Status**: `/api/gomafia-sync/import`

---

## Development Tools

### Recommended VS Code Extensions

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Prisma**: Prisma schema support
- **TypeScript**: TypeScript support
- **Tailwind CSS IntelliSense**: Tailwind autocomplete

### Debugging

- **Next.js Dev Tools**: Built-in debugging
- **React DevTools**: React component debugging
- **Prisma Studio**: Database debugging
- **Vercel Logs**: Production debugging

---

## Additional Resources

- **API Documentation**: `docs/api/README.md`
- **Deployment Guide**: `docs/deployment/VERCEL-SETUP.md`
- **Testing Guide**: `docs/tests/README.md`
- **Architecture Docs**: `docs/architecture/README.md`
- **Routes Documentation**: `docs/technical/ROUTES.md`

Generated: 2025-11-22T17:39:05.300Z
