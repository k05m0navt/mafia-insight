# Epic Technical Specification: Player Analytics Dashboard

Date: 2025-01-27
Author: k05m0navt
Epic ID: 4
Status: Draft

---

## Overview

Epic 4: Player Analytics Dashboard enables players to view comprehensive role-based performance analytics and insights. This epic transforms raw game data from gomafia.pro into actionable insights that help players understand their performance patterns, identify strengths and weaknesses across roles (Don, Mafia, Sheriff, Citizen), and track improvement over time.

The epic delivers the core analytics experience that defines Mafia Insight's value proposition. Players can analyze their complete game history through role-based metrics, ELO trends, win rate analysis, and performance comparisons. The implementation includes responsive data visualizations, filtering capabilities, mobile PWA support, and smooth navigation between analytics sections.

This epic builds upon Epic 2 (Data Import & Synchronization) which provides the foundational game data, and Epic 1 (User Access & Platform Foundation) which establishes authentication and the visual design system. The analytics dashboard serves as the primary user-facing feature that creates the WOW moment when users first see their comprehensive performance data.

## Objectives and Scope

### In-Scope

- **Role-Based Performance Metrics**: Display performance metrics broken down by role (Don, Mafia, Sheriff, Citizen) with win rates, games played, and average ELO per role
- **ELO Rating System**: Show current ELO rating with historical progression over time via line charts
- **Win Rate Analysis**: Analyze win rates across different roles and game scenarios with visual charts
- **Performance Statistics**: Display comprehensive performance summaries including total games, wins/losses, streaks, and recent activity
- **Date Range Filtering**: Filter all analytics by date range (last week, month, 3 months, year, all time)
- **Role Filtering**: Filter analytics by specific role(s) with multi-select capability
- **Performance Trends**: Show time-series trends for key metrics (win rate, ELO, games per period)
- **Role Comparison**: Side-by-side comparison of performance across different roles
- **Analytics Navigation**: Smooth navigation between analytics sections with tabs/sidebar
- **Mobile PWA Support**: Responsive layouts optimized for mobile devices with PWA capabilities
- **Responsive Charts**: Data visualizations that adapt to screen size with rich visual elements
- **Search Functionality**: Search for specific players or games with autocomplete
- **Game Detail View**: Detailed view of individual games with impressive layouts

### Out-of-Scope

- **Judge Analytics**: Deferred to Epic 6 (Judge Analytics Dashboard)
- **Timeline Visualization**: Deferred to Epic 5 (Timeline Visualization)
- **Club Analytics**: Post-MVP feature
- **Custom Dashboards**: Post-MVP feature
- **Export Capabilities**: Post-MVP feature (PDF/image export)
- **Social Sharing**: Post-MVP feature
- **Player-to-Player Comparison**: Post-MVP feature
- **AI-Powered Insights**: Post-MVP feature
- **Performance Predictions**: Post-MVP feature

## System Architecture Alignment

This epic aligns with the Clean Architecture + Hexagonal Architecture patterns established in the architecture document. Analytics components reside in the Presentation Layer (`src/components/analytics/`), use cases in the Application Layer (`src/application/use-cases/`), and data access through the Infrastructure Layer (`src/infrastructure/persistence/`).

**Key Architecture Components:**

- **API Routes**: `src/app/api/players/[id]/analytics/` - RESTful endpoints for analytics data
- **Components**: `src/components/analytics/` - React components for analytics visualization
- **Use Cases**: `src/application/use-cases/` - Business logic for analytics calculations
- **State Management**: TanStack Query for server state, Zustand for client state (filters)
- **Chart Library**: Recharts or Chart.js for data visualizations
- **Design System**: ShadCN/UI components with Tailwind CSS variants

**Architecture Constraints:**

- All API endpoints must follow the established request/response format patterns
- Components must use ShadCN/UI base components with custom styling
- Data fetching must use TanStack Query for caching and background refetching
- Filter state must be managed in Zustand store (`src/store/analyticsStore.ts`)
- All analytics calculations must be performed server-side for performance
- Responsive design must follow mobile-first approach (320px, 768px, 1024px breakpoints)

## Detailed Design

### Services and Modules

| Service/Module               | Responsibility                                            | Inputs                              | Outputs                   | Owner             |
| ---------------------------- | --------------------------------------------------------- | ----------------------------------- | ------------------------- | ----------------- |
| `PlayerAnalyticsService`     | Calculate role-based metrics, ELO trends, win rates       | Player ID, date range, role filters | Aggregated analytics data | Application Layer |
| `AnalyticsController`        | Handle HTTP requests for analytics endpoints              | HTTP requests with query params     | JSON responses            | Adapters Layer    |
| `RoleMetricsCalculator`      | Calculate metrics per role (Don, Mafia, Sheriff, Citizen) | Game participation data             | Role-specific metrics     | Domain Layer      |
| `ELOTrendCalculator`         | Calculate ELO progression over time                       | Historical game data                | ELO time-series data      | Domain Layer      |
| `WinRateAnalyzer`            | Analyze win rates by role and scenario                    | Game outcomes by role               | Win rate statistics       | Domain Layer      |
| `PerformanceStatsAggregator` | Aggregate overall performance statistics                  | All game data                       | Summary statistics        | Domain Layer      |
| `TrendAnalyzer`              | Calculate performance trends over time periods            | Time-series game data               | Trend metrics             | Domain Layer      |
| `RoleComparisonService`      | Compare performance across roles                          | Role-specific metrics               | Comparison data           | Application Layer |
| `SearchService`              | Search players and games                                  | Search query                        | Search results            | Application Layer |
| `GameDetailService`          | Retrieve detailed game information                        | Game ID                             | Complete game data        | Application Layer |

### Data Models and Contracts

**Player Analytics Data Model:**

```typescript
interface RoleMetrics {
  role: 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN';
  winRate: number; // percentage (0-100)
  gamesPlayed: number;
  wins: number;
  losses: number;
  averageELO: number;
  performanceLevel: 'excellent' | 'good' | 'needs_improvement';
}

interface ELOTrendPoint {
  date: string; // ISO 8601
  elo: number;
  gameId: string;
}

interface WinRateAnalysis {
  overall: number; // percentage
  byRole: Record<string, number>; // role -> win rate percentage
  byScenario?: Record<string, number>; // scenario -> win rate (if available)
  comparisonToAverage?: number; // difference from average (if available)
}

interface PerformanceSummary {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  averageGameDuration?: number; // minutes (if available)
  longestWinStreak: number;
  bestELOAchieved: number;
  recentActivity: {
    thisWeek: number;
    thisMonth: number;
  };
}

interface PerformanceTrend {
  period: 'week' | 'month' | 'quarter';
  startDate: string;
  endDate: string;
  metrics: {
    winRate: number;
    elo: number;
    gamesPlayed: number;
  };
  trend: 'up' | 'down' | 'stable';
  changeFromPrevious: number; // percentage change
}

interface RoleComparison {
  roles: RoleMetrics[];
  bestPerformingRole: 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN';
  metrics: {
    winRate: Record<string, number>;
    gamesPlayed: Record<string, number>;
    averageELO: Record<string, number>;
    winStreak: Record<string, number>;
  };
}
```

**Database Schema (Existing Models Used):**

- `Player` - Player information
- `Game` - Game instances
- `GameParticipation` - Player-game relationships with roles
- `PlayerRoleStats` - Pre-computed per-role statistics
- `PlayerYearStats` - Yearly aggregated statistics
- `Analytics` - Pre-computed metrics cache (optional optimization)

**Filter State Model (Zustand):**

```typescript
interface AnalyticsFilters {
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    preset:
      | 'last_week'
      | 'last_month'
      | 'last_3_months'
      | 'last_year'
      | 'all_time'
      | null;
  };
  roles: ('DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN')[];
  reset: () => void;
  setDateRange: (range: DateRange) => void;
  setRoles: (roles: string[]) => void;
}
```

### APIs and Interfaces

**API Endpoints:**

1. **GET `/api/players/[id]/analytics/role-based`**
   - **Query Parameters**: `dateRange?`, `roles?`
   - **Response**: `{ roleMetrics: RoleMetrics[] }`
   - **Error Codes**: `404` (Player not found), `400` (Invalid parameters)

2. **GET `/api/players/[id]/analytics/elo-trends`**
   - **Query Parameters**: `dateRange?` (required), `period?` ('day' | 'week' | 'month')
   - **Response**: `{ trends: ELOTrendPoint[], currentELO: number, historicalHigh: number, historicalLow: number }`
   - **Error Codes**: `404`, `400`

3. **GET `/api/players/[id]/analytics/win-rates`**
   - **Query Parameters**: `dateRange?`, `roles?`
   - **Response**: `WinRateAnalysis`
   - **Error Codes**: `404`, `400`

4. **GET `/api/players/[id]/analytics/summary`**
   - **Query Parameters**: `dateRange?`
   - **Response**: `PerformanceSummary`
   - **Error Codes**: `404`, `400`

5. **GET `/api/players/[id]/analytics/trends`**
   - **Query Parameters**: `dateRange?`, `period` ('week' | 'month' | 'quarter')
   - **Response**: `{ trends: PerformanceTrend[] }`
   - **Error Codes**: `404`, `400`

6. **GET `/api/players/[id]/analytics/role-comparison`**
   - **Query Parameters**: `dateRange?`
   - **Response**: `RoleComparison`
   - **Error Codes**: `404`, `400`

7. **GET `/api/search`**
   - **Query Parameters**: `q` (search query), `type?` ('player' | 'game' | 'all')
   - **Response**: `{ players: Player[], games: Game[] }`
   - **Error Codes**: `400` (Missing query)

8. **GET `/api/games/[id]`**
   - **Response**: Complete game data with all participants, roles, outcome
   - **Error Codes**: `404` (Game not found)

**Component Interfaces:**

```typescript
// Role Metrics Display Component
interface RoleMetricsDisplayProps {
  playerId: string;
  dateRange?: DateRange;
  roles?: string[];
}

// ELO Trends Chart Component
interface ELOTrendsChartProps {
  playerId: string;
  dateRange: DateRange;
  period: 'day' | 'week' | 'month';
}

// Win Rate Analysis Component
interface WinRateAnalysisProps {
  playerId: string;
  dateRange?: DateRange;
  roles?: string[];
}

// Performance Summary Component
interface PerformanceSummaryProps {
  playerId: string;
  dateRange?: DateRange;
}

// Trends Chart Component
interface TrendsChartProps {
  playerId: string;
  dateRange: DateRange;
  period: 'week' | 'month' | 'quarter';
}

// Role Comparison Component
interface RoleComparisonProps {
  playerId: string;
  dateRange?: DateRange;
}

// Search Component
interface SearchProps {
  onSelect: (result: Player | Game) => void;
}

// Game Detail Component
interface GameDetailProps {
  gameId: string;
  onClose?: () => void;
}
```

### Workflows and Sequencing

**Analytics Dashboard Load Flow:**

```
1. User navigates to /dashboard/analytics
   ↓
2. Component mounts, checks authentication
   ↓
3. Load filter state from Zustand store (or defaults)
   ↓
4. Fetch role-based metrics (GET /api/players/[id]/analytics/role-based)
   ↓
5. Fetch performance summary (GET /api/players/[id]/analytics/summary)
   ↓
6. Display role cards and summary stats
   ↓
7. User selects analytics section (ELO, Win Rates, Trends, Comparison)
   ↓
8. Fetch section-specific data with current filters
   ↓
9. Display charts/visualizations with loading states
   ↓
10. User applies filters (date range, roles)
    ↓
11. Update Zustand store with new filters
    ↓
12. Refetch all active analytics with new filters
    ↓
13. Update visualizations with smooth animations
```

**Search Flow:**

```
1. User types in search input
   ↓
2. Debounce 300ms
   ↓
3. If query length >= 2, fetch search results (GET /api/search?q=...)
   ↓
4. Display autocomplete dropdown with results
   ↓
5. User selects result
   ↓
6. Navigate to player detail or game detail page
```

**Game Detail View Flow:**

```
1. User clicks on game (from list, search, or timeline)
   ↓
2. Fetch game details (GET /api/games/[id])
   ↓
3. Display game detail modal/page
   ↓
4. Show game information: date, players, roles, outcome
   ↓
5. User closes modal or navigates back
```

**Filter Application Flow:**

```
1. User selects date range or role filter
   ↓
2. Update Zustand analyticsStore with new filter values
   ↓
3. Trigger TanStack Query refetch for all active queries
   ↓
4. Show loading states on affected components
   ↓
5. Update visualizations with new data
   ↓
6. Smooth transition animation (< 300ms)
```

## Non-Functional Requirements

### Performance

**Response Time Targets:**

- Analytics API endpoints: < 500ms for aggregated data
- Search API: < 200ms for autocomplete results
- Game detail API: < 300ms
- Chart rendering: < 2 seconds for initial render
- Filter application: < 300ms for data refresh

**Optimization Strategies:**

- Pre-compute role-based metrics in `PlayerRoleStats` table
- Use database indexes on `player_id`, `role`, `game_date` columns
- Cache analytics data in Redis for frequently accessed players (5-minute TTL)
- Implement pagination for large datasets
- Use TanStack Query caching (5-minute stale time, 10-minute GC time)
- Lazy load chart libraries (code splitting)
- Virtual scrolling for large game lists

**Performance Monitoring:**

- Track API response times via Sentry
- Monitor chart rendering performance
- Track filter application latency
- Measure Time to First Insight metric (< 30 seconds target)

### Security

**Authentication & Authorization:**

- All analytics endpoints require authentication (NextAuth.js session)
- Users can only access their own analytics data (player ID must match session user)
- Admin users can access any player's analytics
- API routes validate user session via `authenticateRequest()` middleware

**Data Protection:**

- Player data encrypted in transit (HTTPS)
- Sensitive analytics data not exposed in client-side code
- Input validation on all query parameters (Zod schemas)
- SQL injection protection via Prisma ORM parameterized queries
- XSS protection via React automatic escaping

**Rate Limiting:**

- Analytics endpoints: 60 requests per minute per user
- Search endpoint: 30 requests per minute per user
- Rate limiting via Redis-based limiter

### Reliability/Availability

**Availability Targets:**

- 99.9% uptime for analytics endpoints
- Graceful degradation if chart library fails to load
- Fallback to server-rendered data tables if client-side charts fail

**Error Handling:**

- Network errors: Retry with exponential backoff (3 attempts)
- API errors: Display user-friendly error messages via toast notifications
- Missing data: Show empty states with helpful messaging
- Chart errors: Fallback to data table view

**Data Consistency:**

- Analytics calculations use database transactions for consistency
- Cache invalidation on data updates (game imports, syncs)
- Eventual consistency acceptable for pre-computed metrics (refresh on next request)

### Observability

**Logging Requirements:**

- Log all analytics API requests with player ID, endpoint, response time
- Log filter applications with filter values
- Log search queries (anonymized)
- Error logging with full context (player ID, query params, stack trace)

**Metrics to Track:**

- Analytics endpoint response times (p50, p95, p99)
- Chart rendering times
- Filter application latency
- Search query performance
- User engagement: most viewed analytics sections
- Error rates by endpoint

**Monitoring:**

- Sentry error tracking for API errors
- Performance monitoring via web-vitals
- Custom analytics events for user interactions
- Database query performance monitoring

**Tracing:**

- Request ID propagation through all layers
- Correlation IDs for related requests (filter application triggers multiple fetches)

## Dependencies and Integrations

### External Dependencies

**Chart Libraries:**

- `recharts` (^2.10.0) or `chart.js` (^4.4.0) - Data visualization
- `react-chartjs-2` (^5.2.0) - React wrapper for Chart.js (if using Chart.js)

**Date Handling:**

- `date-fns` (^4.1.0) - Date formatting and manipulation

**UI Components:**

- `@radix-ui/react-*` - Base primitives (via ShadCN/UI)
- `lucide-react` - Icons
- `tailwindcss` (^3.3.0) - Styling

**State Management:**

- `@tanstack/react-query` (^5.0.0) - Server state management
- `zustand` (^4.4.0) - Client state management

**Form/Input Components:**

- `react-hook-form` - Form handling (for filters)
- `zod` (^4.1.12) - Schema validation

### Internal Dependencies

**Database:**

- Prisma Client (^5.0.0) - Database access
- PostgreSQL (via Supabase) - Data storage

**Authentication:**

- NextAuth.js (^4.24.12) - Session management
- Supabase Auth - User authentication

**Caching:**

- Redis (^4.6.0) - Response caching and rate limiting

**Architecture Layers:**

- Application Layer: Use cases for analytics calculations
- Domain Layer: Domain services for metrics calculation
- Infrastructure Layer: Database repositories
- Adapters Layer: HTTP controllers

### Integration Points

**Data Import Integration:**

- Analytics automatically update when new games are imported (Epic 2)
- Cache invalidation on data sync completion
- Real-time updates via TanStack Query background refetching

**User Authentication Integration:**

- Player ID derived from authenticated user session
- Role-based access control for admin analytics access

**Design System Integration:**

- All components use ShadCN/UI base components
- Tailwind CSS variants for styling
- Design tokens from UX Design Specification

## Acceptance Criteria (Authoritative)

1. **AC1: Role-Based Performance Metrics Display**
   - Given a logged-in user with imported game data
   - When viewing the analytics dashboard
   - Then the system displays four role cards (Don, Mafia, Sheriff, Citizen) with win rate percentage, games played count, and average ELO for each role
   - And visual indicators (color-coded, icons) show performance level (excellent/good/needs improvement)
   - And a role comparison chart shows relative performance across roles
   - And smooth animations occur when metrics load/update

2. **AC2: ELO Rating with Historical Trends**
   - Given a user with ELO rating data
   - When viewing ELO analytics
   - Then the system displays current ELO rating prominently
   - And a line chart shows ELO progression over time (x-axis: date, y-axis: ELO)
   - And historical high/low ELO values are displayed
   - And ELO change indicators (up/down arrows, color-coded) are shown
   - And a time range selector (last month, 3 months, 6 months, all time) is available
   - And hover tooltips show exact ELO value and date

3. **AC3: Win Rate Analysis Across Roles**
   - Given a user with game data including win/loss records per role
   - When viewing win rate analytics
   - Then the system displays overall win rate percentage
   - And win rate breakdown by role (Don: X%, Mafia: Y%, Sheriff: Z%, Citizen: W%)
   - And win rate by scenario (tournament vs casual, if available) is shown
   - And comparison to average win rates (if aggregated data available) is displayed
   - And visual charts (bar chart comparing win rates, pie chart showing win/loss distribution) are shown

4. **AC4: Basic Performance Statistics & Summaries**
   - Given a user with imported game data
   - When viewing the performance summary section
   - Then the system displays total games played count
   - And total wins and losses with percentages
   - And average game duration (if available)
   - And best performance indicators (longest win streak, best ELO achieved)
   - And recent activity summary (games played this week/month)
   - And key metrics cards with large, readable numbers and icons

5. **AC5: Date Range Filtering for Analytics**
   - Given a user viewing analytics
   - When selecting a date range (date picker or predefined: last week, month, 3 months, year, all time)
   - Then all analytics views update to show data only for selected date range
   - And charts, metrics, and statistics refresh
   - And active filter indicator shows ("Showing: Last 3 months")
   - And smooth transition/animation occurs when data updates
   - And filter selection is maintained across page navigation

6. **AC6: Role Filtering for Analytics**
   - Given a user viewing analytics
   - When selecting role filter(s) (Don, Mafia, Sheriff, Citizen)
   - Then all analytics update to show data only for selected role(s)
   - And multi-select is allowed (view multiple roles simultaneously or single role)
   - And active filter badges show ("Don selected", "Mafia + Sheriff selected")
   - And charts and metrics refresh immediately
   - And clear/reset filter option is available

7. **AC7: Performance Trends Over Time**
   - Given a user with historical game data
   - When viewing trends analytics
   - Then the system displays time-series charts showing key metrics over time (win rate, ELO, games played per period)
   - And trend indicators (upward/downward arrows, trend lines) are shown
   - And period grouping options (by week, month, quarter) are available
   - And comparative analysis (this month vs last month) is displayed
   - And visual trend lines with annotations for significant changes are shown

8. **AC8: Role Comparison Capability**
   - Given a user with performance data for multiple roles
   - When viewing role comparison
   - Then the system displays side-by-side comparison table or cards showing metrics for each role (win rate, games played, average ELO, win streak)
   - And comparison charts (bar chart comparing metrics across roles) are shown
   - And best-performing role is highlighted (visual emphasis: color, badge)
   - And ability to select which metrics to compare is available

9. **AC9: Analytics Navigation & Data Display Components**
   - Given a user on the analytics dashboard
   - When navigating between sections (Role Analytics, ELO Trends, Win Rates, etc.)
   - Then clear navigation is provided (tabs, sidebar, or bottom navigation on mobile)
   - And smooth animations/transitions occur between sections (< 300ms transition)
   - And scroll position is maintained or returns to top appropriately
   - And active section is highlighted in navigation
   - And responsive navigation is used (mobile: bottom nav or hamburger menu, desktop: sidebar or top tabs)

10. **AC10: Mobile PWA Access & Responsive Layouts**
    - Given a user on a mobile device
    - When accessing the platform
    - Then the system displays beautifully on mobile screens (320px+ width)
    - And PWA installation prompt is provided (Add to Home Screen)
    - And offline access works for previously loaded data (service worker caching)
    - And touch-optimized interactions are used (44x44px minimum touch targets)
    - And responsive layouts adapt to screen size (stacked cards on mobile, side-by-side on desktop)
    - And charts and graphs scale appropriately for mobile viewing
    - And navigation uses mobile-friendly patterns (bottom nav, hamburger menu)

11. **AC11: Responsive Charts & Data Visualization**
    - Given a user viewing analytics
    - When data is displayed
    - Then charts and graphs resize responsively (mobile: stacked, desktop: side-by-side)
    - And high-quality visualizations with smooth animations are shown
    - And data tables scroll horizontally on mobile or use card layout
    - And rich visual elements are used (icons, color-coding, gradients, shadows)
    - And loading states with skeleton screens or spinners are shown
    - And empty states with helpful messaging are displayed when no data available

12. **AC12: Search for Players or Games**
    - Given a user on the platform
    - When using the search functionality
    - Then search input with autocomplete suggestions is provided
    - And search across player names and game IDs/dates is performed
    - And search results show in real-time as user types (debounced, 300ms delay)
    - And matching text is highlighted in results
    - And visual feedback (loading indicator during search) is provided
    - And navigation to game/player detail page occurs on selection
    - And smooth search animation/transition occurs

13. **AC13: Individual Game Detail View**
    - Given a user viewing a game in a list or timeline
    - When clicking on a game
    - Then game detail modal or page with impressive layout is displayed showing:
      - Game date and time
      - All players and their roles
      - Game outcome (who won: Mafia or Citizens)
      - Individual player actions/performance (if available)
      - Tournament information (if tournament game)
      - Visual storytelling elements (role icons, outcome indicators, player avatars)
    - And smooth modal/page transition animation occurs
    - And close/back navigation is available

## Traceability Mapping

| AC   | Spec Section(s)             | Component(s)/API(s)                                                 | Test Idea                                                                     |
| ---- | --------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| AC1  | PRD FR16, Epic 4 Story 4.1  | `RoleMetricsDisplay`, `GET /api/players/[id]/analytics/role-based`  | Test role cards render with correct metrics, test API returns role-based data |
| AC2  | PRD FR17, Epic 4 Story 4.2  | `ELOTrendsChart`, `GET /api/players/[id]/analytics/elo-trends`      | Test ELO chart displays correctly, test time range selector updates chart     |
| AC3  | PRD FR18, Epic 4 Story 4.3  | `WinRateAnalysis`, `GET /api/players/[id]/analytics/win-rates`      | Test win rate calculations, test bar/pie charts render correctly              |
| AC4  | PRD FR19, Epic 4 Story 4.4  | `PerformanceSummary`, `GET /api/players/[id]/analytics/summary`     | Test summary stats display, test metrics cards render                         |
| AC5  | PRD FR20, Epic 4 Story 4.5  | `DateRangeFilter`, Analytics store, all analytics endpoints         | Test date filter updates all views, test filter persistence                   |
| AC6  | PRD FR21, Epic 4 Story 4.6  | `RoleFilter`, Analytics store, all analytics endpoints              | Test role filter updates views, test multi-select works                       |
| AC7  | PRD FR22, Epic 4 Story 4.7  | `TrendsChart`, `GET /api/players/[id]/analytics/trends`             | Test trend charts display, test period grouping works                         |
| AC8  | PRD FR23, Epic 4 Story 4.8  | `RoleComparison`, `GET /api/players/[id]/analytics/role-comparison` | Test comparison table displays, test best role highlighting                   |
| AC9  | PRD FR43, Epic 4 Story 4.9  | `AnalyticsNavigation`, route structure                              | Test navigation transitions, test active section highlighting                 |
| AC10 | PRD FR44, Epic 4 Story 4.10 | PWA manifest, service worker, responsive layouts                    | Test mobile layout, test PWA installation, test offline access                |
| AC11 | PRD FR46, Epic 4 Story 4.11 | Chart components, responsive wrappers                               | Test chart responsiveness, test loading/empty states                          |
| AC12 | PRD FR47, Epic 4 Story 4.12 | `SearchInput`, `GET /api/search`                                    | Test search autocomplete, test debouncing, test result navigation             |
| AC13 | PRD FR48, Epic 4 Story 4.13 | `GameDetail`, `GET /api/games/[id]`                                 | Test game detail modal displays, test all game information shown              |

## Risks, Assumptions, Open Questions

### Risks

**R1: Performance with Large Datasets**

- **Risk**: Analytics calculations may be slow for players with thousands of games
- **Mitigation**: Pre-compute metrics in `PlayerRoleStats` table, implement pagination, use database indexes, cache frequently accessed data
- **Status**: Mitigated via architecture decisions

**R2: Chart Library Bundle Size**

- **Risk**: Chart libraries (Recharts/Chart.js) may increase bundle size significantly
- **Mitigation**: Lazy load chart libraries, use code splitting, consider lighter alternatives if needed
- **Status**: To be monitored during implementation

**R3: Mobile Performance**

- **Risk**: Complex charts may perform poorly on mobile devices
- **Mitigation**: Use responsive chart configurations, implement virtual scrolling, optimize for mobile-first
- **Status**: To be tested during implementation

**R4: Real-time Data Consistency**

- **Risk**: Analytics may show stale data after new games are imported
- **Mitigation**: Implement cache invalidation on data sync, use TanStack Query background refetching
- **Status**: Mitigated via caching strategy

### Assumptions

**A1: Data Availability**

- Assumption: Game data is already imported and available (Epic 2 complete)
- Validation: Verify data import completion before analytics implementation

**A2: User Authentication**

- Assumption: Users are authenticated and player ID is available from session
- Validation: Verify NextAuth.js session provides user ID

**A3: Chart Library Choice**

- Assumption: Recharts or Chart.js will meet visualization requirements
- Validation: Evaluate both libraries during implementation, choose based on bundle size and features

**A4: Filter State Management**

- Assumption: Zustand store is sufficient for filter state management
- Validation: Verify Zustand store handles filter persistence correctly

### Open Questions

**Q1: Pre-computed Metrics Strategy**

- Question: Should we pre-compute all analytics metrics or calculate on-demand?
- Next Step: Evaluate performance trade-offs, implement on-demand first, add pre-computation if needed

**Q2: Chart Library Selection**

- Question: Recharts vs Chart.js - which provides better mobile performance and smaller bundle?
- Next Step: Create proof-of-concept with both libraries, measure bundle size and performance

**Q3: Offline PWA Capabilities**

- Question: How much analytics data should be cached for offline access?
- Next Step: Define caching strategy for service worker, prioritize recent data and summary stats

**Q4: Search Implementation**

- Question: Full-text search via PostgreSQL or external search service (Algolia, Elasticsearch)?
- Next Step: Start with PostgreSQL full-text search, evaluate external service if performance issues

**Q5: Analytics Caching Strategy**

- Question: What TTL should be used for Redis caching of analytics data?
- Next Step: Start with 5-minute TTL, adjust based on data update frequency

## Test Strategy Summary

### Test Levels

**Unit Tests:**

- Test analytics calculation functions (role metrics, ELO trends, win rates)
- Test filter state management (Zustand store)
- Test date range and role filter logic
- Test search query processing
- Coverage target: 80%+

**Integration Tests:**

- Test API endpoints with various query parameters
- Test database queries return correct aggregated data
- Test filter application triggers correct API calls
- Test cache invalidation on data updates
- Test authentication/authorization on API endpoints

**Component Tests:**

- Test analytics components render correctly
- Test chart components display data accurately
- Test filter components update state correctly
- Test navigation components highlight active sections
- Test loading and empty states display appropriately
- Test responsive layouts on different screen sizes

**E2E Tests:**

- Test complete analytics dashboard flow (load → view metrics → apply filters → view trends)
- Test search flow (type query → see results → select result → view detail)
- Test game detail view flow (click game → view modal → close)
- Test mobile PWA flow (install → access offline → view cached data)
- Test filter persistence across navigation

### Test Coverage

**Acceptance Criteria Coverage:**

- All 13 acceptance criteria must have corresponding tests
- Each AC should have at least one unit test, one integration test, and one E2E test

**Critical Paths:**

- Analytics dashboard load and display
- Filter application and data refresh
- Chart rendering and responsiveness
- Search functionality
- Mobile PWA functionality

**Edge Cases:**

- No game data available (empty states)
- Very large datasets (performance)
- Invalid filter combinations
- Network errors during data fetch
- Chart library load failures

### Test Frameworks

- **Unit/Integration**: Vitest (^1.0.0)
- **Component**: React Testing Library (^16.0.0)
- **E2E**: Playwright (^1.56.1)
- **Coverage**: @vitest/coverage-v8

### Performance Testing

- Load testing for analytics endpoints with large datasets
- Chart rendering performance on mobile devices
- Filter application latency measurement
- Bundle size monitoring for chart libraries
