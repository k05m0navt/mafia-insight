# Mafia Insight - Game Analytics Platform

A comprehensive analytics platform for Sport Mafia game players, teams, and tournaments. Built with Next.js 14, TypeScript, and modern web technologies.

## 🎯 Features

### Player Analytics

- **Role-based Performance**: Track performance across Don, Mafia, Sheriff, and Citizen roles
- **ELO Rating System**: Monitor skill progression with detailed rating history
- **Win Rate Analysis**: Analyze success rates across different game scenarios
- **Historical Trends**: View performance trends over time with interactive charts

### Team Analytics

- **Club Management**: Create and manage gaming clubs
- **Member Statistics**: Track individual and team performance
- **Collaborative Insights**: Share analytics with team members
- **Team Rankings**: Compare club performance across the platform

### Tournament Analytics

- **Live Updates**: Real-time tournament progress tracking
- **Bracket Visualization**: Interactive tournament brackets
- **Participant Tracking**: Monitor player performance in tournaments
- **Prize Pool Management**: Track tournament rewards and payouts

### Data Import & Synchronization

- **GoMafia.pro Integration**: Comprehensive historical data import from gomafia.pro
- **Auto-Trigger Import**: Automatically populates empty database on first visit
- **Progress Tracking**: Real-time import progress with percentage complete and current operation
- **Validation & Quality**: Data validation with ≥98% quality threshold
- **Integrity Checks**: Referential integrity verification for all imported relationships
- **Error Recovery**: Automatic retry with exponential backoff, resume capability, and manual retry UI
- **Checkpoint System**: Resume interrupted imports from last completed batch
- **Advisory Locks**: Prevents concurrent imports across horizontally scaled instances

### Progressive Web App (PWA)

- **Offline Support**: Access analytics even without internet connection
- **Mobile Optimized**: Native app-like experience on mobile devices
- **Push Notifications**: Get notified about tournament updates and achievements
- **Installable**: Add to home screen for quick access

## 🚀 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **ShadCN/UI** - Component library
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### Backend

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database with advisory locks
- **Prisma ORM** - Database toolkit with migrations
- **Playwright** - Browser automation for web scraping
- **Zod** - Schema validation for imported data
- **NextAuth.js** - Authentication
- **Redis** - Caching and sessions

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Unit testing
- **Playwright** - E2E testing

## 📚 Documentation

- **[Routes Documentation](./ROUTES.md)** - Complete guide to all routes, authentication requirements, and access control
- **[API Documentation](./API.md)** - Comprehensive API reference
- **[Deployment Guide](./docs/deployment/VERCEL-SETUP.md)** - Deploy to production
- **[Testing Guide](./docs/testing/README.md)** - Testing strategy and guides

## 📦 Installation

### Prerequisites

- Node.js 18+
- Yarn package manager
- PostgreSQL database
- Redis server

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/mafia-insight.git
   cd mafia-insight
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables with your configuration.

4. **Database Setup**

   ```bash
   # Generate Prisma client
   yarn db:generate

   # Run database migrations
   yarn db:migrate

   # Seed the database (optional)
   yarn db:seed
   ```

5. **Create First Admin User**

   After setting up the database, you need to create the first administrator account. You have two options:

   **Option A: Using the Web Interface**

   ```bash
   # Start the development server
   yarn dev
   ```

   Then visit [http://localhost:3000/admin/bootstrap](http://localhost:3000/admin/bootstrap) to create your first admin user through the web interface.

   **Option B: Using the Command Line Script**

   ```bash
   # Create admin user via script
   node scripts/create-first-admin.js admin@example.com "Admin User"
   ```

6. **Start Development Server**
   ```bash
   yarn dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Analytics dashboard routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # ShadCN/UI components
│   ├── analytics/        # Analytics-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
└── styles/              # Tailwind CSS styles
```

## 🔧 Development

### Available Scripts

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn lint:fix         # Fix ESLint issues
yarn format           # Format code with Prettier
yarn type-check       # Run TypeScript checks

# Testing
yarn test             # Run unit tests
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage
yarn test:e2e         # Run E2E tests

# Database
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Run database migrations
yarn db:deploy        # Deploy migrations to production
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database
yarn db:studio        # Open Prisma Studio
```

### Code Quality

The project enforces high code quality standards:

- **ESLint** configuration for consistent code style
- **Prettier** for automatic code formatting
- **Husky** git hooks for pre-commit checks
- **TypeScript** for type safety
- **Testing** with Jest and Playwright
- **Accessibility** - WCAG 2.1 Level AA compliance on all pages
- **Error Handling** - Comprehensive error handling with 90%+ coverage target
- **Code Duplication** - Continuous reduction with 30% reduction target

## 📦 GoMafia.pro Data Import

### Overview

The platform includes a comprehensive data import feature that automatically populates the database with historical data from gomafia.pro. This enables immediate access to thousands of players, games, tournaments, and statistics without manual data entry.

### Auto-Trigger Import

On first visit to the `/players` or `/games` page, the system automatically:

1. Detects an empty database
2. Triggers a comprehensive import process
3. Scrapes data from gomafia.pro including:
   - Players with regional information
   - Clubs with presidents and members
   - Tournaments with metadata (stars, ELO, FSM rating)
   - Games with full participation details
   - Year-specific player statistics
   - Tournament participation history with prize money

### Manual Import Management

Visit `/import` to access the import management interface where you can:

- **View Import Progress**: Real-time progress updates every 2 seconds
- **Monitor Validation**: See data quality metrics (target ≥98% validation rate)
- **Check Integrity**: View referential integrity check results
- **Cancel Import**: Gracefully stop import with checkpoint preservation
- **Resume Import**: Continue interrupted imports from last checkpoint
- **Retry Failed Imports**: Manual retry with error guidance

### Import Features

- **Rate Limiting**: Respects gomafia.pro with 2-second delays between requests (30 req/min)
- **Batch Processing**: Processes 100 records per batch for memory optimization
- **Checkpoints**: Automatic checkpoint saving for resume capability
- **Advisory Locks**: Prevents concurrent imports in horizontally scaled deployments
- **Timeout Protection**: 12-hour maximum duration with automatic timeout
- **Error Recovery**: Exponential backoff retry (1s, 2s, 4s) for transient failures
- **Data Validation**: Zod schema validation for all imported entities
- **Integrity Checks**: Post-import verification of all foreign key relationships

### Import Duration

Expected import times:

- 1,000 players: ~10-15 minutes
- 5,000 games: ~20-30 minutes
- Full historical import: 3-4 hours (estimated for 10,000 players + 50,000 games)
- Maximum timeout: 12 hours

### Troubleshooting

If import fails or shows errors, the system provides:

- **Error codes** (EC-001 through EC-008) with guidance
- **Retry suggestions** based on error type
- **Checkpoint information** for resume capability
- **Validation metrics** showing data quality issues
- **Integrity warnings** for referential integrity failures

For detailed information, see [specs/003-gomafia-data-import/spec.md](./specs/003-gomafia-data-import/spec.md).

---

### Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - Platform users with authentication
- **Players** - Individual game players
- **Clubs** - Gaming teams and organizations
- **Games** - Individual game instances
- **Tournaments** - Competitive events
- **Analytics** - Pre-computed metrics and statistics
- **Regions** - Geographic regions for players and clubs
- **PlayerRoleStats** - Role-specific performance statistics
- **Analytics** - Pre-computed analytics cache

#### Database Performance Optimizations

The database has been optimized for performance with:

- **Foreign Key Indexes**: Added indexes on all foreign key columns for faster joins
  - `clubs.createdBy`, `clubs.presidentId`
  - `players.userId`, `players.clubId`
  - `games.tournamentId`
  - `tournaments.createdBy`
  - `player_tournaments.tournamentId`
  - `game_participations.gameId`
- **Unused Index Removal**: Removed unused indexes to reduce write overhead
- **RLS Policy Optimization**: Optimized Row Level Security policies using `(select auth.uid())` pattern
- **Zero-Downtime Migrations**: All index operations use `CREATE INDEX CONCURRENTLY` for production safety

#### Database Schema Status

- **All tables kept**: Analysis confirmed all tables are actively used or planned features
- **Regions populated**: Default regions seeded via `prisma/seed.ts`
- **PlayerRoleStats**: Populated by StatisticsPhase during data import
- **Analytics**: Ready for population by analytics calculation services

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Database Setup**
   - Set up Supabase project
   - Configure database connection string

3. **Deploy**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="..."

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## 📱 PWA Features

The application is a Progressive Web App with the following features:

- **Offline Support** - Access analytics without internet
- **Mobile Optimized** - Responsive design for all devices
- **Installable** - Add to home screen on mobile devices
- **Push Notifications** - Real-time updates for tournaments
- **Background Sync** - Sync data when connection is restored

## 🔒 Security

- **Authentication** - Secure user authentication with NextAuth.js and Supabase Auth
- **Authorization** - Role-based access control with `authenticateRequest` and `requireRole` middleware
- **Data Validation** - Input validation with Zod schemas
- **Rate Limiting** - API rate limiting to prevent abuse
- **HTTPS** - Secure connections in production
- **Environment-Based Gating** - Test routes automatically gated in production via `NODE_ENV` checks
- **Route Protection** - Multi-layer protection: route handlers, client-side checks, and middleware

## 📊 Analytics & Monitoring

- **Error Tracking** - Sentry integration for error monitoring
- **Performance Monitoring** - Core Web Vitals tracking
- **User Analytics** - Google Analytics integration
- **Database Monitoring** - Query performance tracking
- **Accessibility Monitoring** - Automated WCAG 2.1 Level AA compliance testing
- **Code Quality Metrics** - Code duplication and error handling coverage tracking

## 🔄 Recent Improvements (January 2025)

### Route Refactoring

- **Test Route Gating**: All test routes (`/test-players`, `/api/test-players`, `/api/test-db`) are now automatically gated in production
- **User Management Routes**: Complete authentication and authorization refactoring for all `/api/users/*` routes
- **API Route Completion**: All incomplete API routes now have proper authentication and error handling

### Database Optimizations

- **Foreign Key Indexes**: Added 8 indexes on foreign key columns for improved query performance
- **RLS Policy Optimization**: Optimized policies for better performance at scale
- **Unused Index Cleanup**: Removed unused indexes to reduce write overhead

### Accessibility Improvements

- **Error Pages**: All error pages (`/error`, `/expired`, `/network-error`, `/unauthorized`) refactored for WCAG 2.1 Level AA compliance
- **Semantic HTML**: Proper use of `<main>`, ARIA labels, and role attributes
- **Keyboard Navigation**: Full keyboard accessibility support

### Code Quality

- **Error Handling**: Improved error handling coverage across all routes
- **Authentication Consistency**: Standardized authentication using `authenticateRequest` and `requireRole`
- **Documentation**: Updated route and API documentation to reflect current state

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [ShadCN/UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://prisma.io/) - Database toolkit

## 📞 Support

For support, email support@mafia-insight.com or join our Discord community.

---

**Built with ❤️ for the Mafia gaming community**
