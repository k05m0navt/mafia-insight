# Quickstart Guide: Sport Mafia Game Analytics Platform

**Date**: December 2024  
**Feature**: Sport Mafia Game Analytics Platform  
**Purpose**: Get developers up and running quickly with the analytics platform

## Prerequisites

- Node.js 20+
- Yarn package manager
- Git
- Supabase account
- Redis instance (local or cloud)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/mafia-insight.git
cd mafia-insight

# Install dependencies with yarn
yarn install
```

### 2. Environment Configuration

Create environment files:

```bash
# Copy environment template
cp .env.example .env.local
cp .env.example .env

# Edit .env.local for local development
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mafia_insight"
DIRECT_URL="postgresql://username:password@localhost:5432/mafia_insight"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# External APIs
GOMAFIA_BASE_URL="https://gomafia.pro"
GOMAFIA_API_KEY="your-gomafia-api-key" # if available

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma client
yarn prisma generate

# Run database migrations
yarn prisma migrate dev

# Seed the database with initial data
yarn prisma db seed
```

### 4. Redis Setup

**Local Redis:**

```bash
# Install Redis (macOS)
brew install redis

# Start Redis server
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

**Cloud Redis (Recommended for production):**

- Use Upstash Redis or Redis Cloud
- Update `REDIS_URL` in environment variables

## Development Workflow

### 1. Start Development Server

```bash
# Start the Next.js development server
yarn dev

# The app will be available at http://localhost:3000
```

### 2. Run Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run E2E tests
yarn test:e2e
```

### 3. Code Quality

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Run type checking
yarn type-check

# Format code
yarn format
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── (dashboard)/       # Analytics dashboard
│   │   ├── players/       # Player analytics
│   │   ├── clubs/         # Club analytics
│   │   ├── tournaments/   # Tournament analytics
│   │   └── games/         # Game analytics
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── players/       # Player endpoints
│   │   ├── clubs/         # Club endpoints
│   │   ├── tournaments/   # Tournament endpoints
│   │   ├── games/         # Game endpoints
│   │   └── analytics/     # Analytics endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # ShadCN/UI components
│   ├── analytics/        # Analytics-specific components
│   ├── charts/           # Chart components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   ├── redis.ts         # Redis connection
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── store/               # Zustand state management
├── types/               # TypeScript types
└── styles/              # Tailwind CSS styles
```

## Key Features Implementation

### 1. Authentication

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    // Add OAuth providers (Google, Discord, GitHub)
  ],
  callbacks: {
    session: async ({ session, user }) => {
      // Add user subscription tier to session
      return session;
    },
  },
};
```

### 2. Data Fetching with TanStack Query

```typescript
// hooks/usePlayerAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePlayerAnalytics(playerId: string, role?: string) {
  return useQuery({
    queryKey: ['player-analytics', playerId, role],
    queryFn: () => api.getPlayerAnalytics(playerId, { role }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. State Management with Zustand

```typescript
// store/analyticsStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AnalyticsState {
  selectedRole: string | null;
  timeRange: string;
  setSelectedRole: (role: string | null) => void;
  setTimeRange: (range: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set) => ({
      selectedRole: null,
      timeRange: 'all_time',
      setSelectedRole: (role) => set({ selectedRole: role }),
      setTimeRange: (range) => set({ timeRange: range }),
    }),
    { name: 'analytics-store' }
  )
);
```

### 4. Data Validation with Zod

```typescript
// lib/validations.ts
import { z } from 'zod';

export const PlayerSchema = z
  .object({
    name: z.string().min(2).max(50),
    eloRating: z.number().int().min(0).max(3000),
    totalGames: z.number().int().min(0),
    wins: z.number().int().min(0),
    losses: z.number().int().min(0),
  })
  .refine((data) => data.wins + data.losses === data.totalGames, {
    message: 'Wins + losses must equal total games',
  });

export type Player = z.infer<typeof PlayerSchema>;
```

### 5. UI Components with ShadCN/UI

```typescript
// components/analytics/PlayerCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlayerCardProps {
  player: Player
  role: 'DON' | 'MAFIA' | 'SHERIFF' | 'CITIZEN'
}

export function PlayerCard({ player, role }: PlayerCardProps) {
  const roleColors = {
    DON: 'bg-purple-500',
    MAFIA: 'bg-black',
    SHERIFF: 'bg-yellow-400',
    CITIZEN: 'bg-red-500'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {player.name}
          <Badge className={roleColors[role]}>
            {role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">ELO Rating</p>
            <p className="text-2xl font-bold">{player.eloRating}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">
              {((player.wins / player.totalGames) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

## Data Synchronization

### 1. gomafia.pro Data Parser

```typescript
// lib/parsers/gomafiaParser.ts
import { JSDOM } from 'jsdom';
import { PlayerSchema } from '@/lib/validations';

export class GomafiaParser {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async parsePlayerData(playerId: string): Promise<Player> {
    const response = await fetch(`${this.baseUrl}/player/${playerId}`);
    const html = await response.text();
    const dom = new JSDOM(html);

    // Parse HTML and extract player data
    const playerData = this.extractPlayerData(dom.window.document);

    // Validate with Zod schema
    return PlayerSchema.parse(playerData);
  }

  private extractPlayerData(document: Document): Partial<Player> {
    // Implementation for parsing HTML and extracting data
    // This would be specific to gomafia.pro's HTML structure
  }
}
```

### 2. Background Jobs

```typescript
// lib/jobs/dataSyncJob.ts
import { CronJob } from 'cron';
import { GomafiaParser } from '@/lib/parsers/gomafiaParser';

export class DataSyncJob {
  private parser: GomafiaParser;

  constructor() {
    this.parser = new GomafiaParser(process.env.GOMAFIA_BASE_URL!);
  }

  start() {
    // Run every 5 minutes
    new CronJob('*/5 * * * *', async () => {
      await this.syncData();
    }).start();
  }

  private async syncData() {
    try {
      // Fetch and parse data from gomafia.pro
      const players = await this.parser.parseAllPlayers();

      // Update database
      await this.updateDatabase(players);

      // Clear cache
      await this.clearCache();
    } catch (error) {
      console.error('Data sync failed:', error);
    }
  }
}
```

## Testing Strategy

### 1. Unit Tests

```typescript
// tests/lib/validations.test.ts
import { describe, it, expect } from 'vitest';
import { PlayerSchema } from '@/lib/validations';

describe('PlayerSchema', () => {
  it('should validate correct player data', () => {
    const validPlayer = {
      name: 'Test Player',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 40,
    };

    expect(() => PlayerSchema.parse(validPlayer)).not.toThrow();
  });

  it('should reject invalid data', () => {
    const invalidPlayer = {
      name: 'Test Player',
      eloRating: 1500,
      totalGames: 100,
      wins: 60,
      losses: 50, // This should fail validation
    };

    expect(() => PlayerSchema.parse(invalidPlayer)).toThrow();
  });
});
```

### 2. Integration Tests

```typescript
// tests/api/players.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '@/lib/test-utils';

describe('/api/players', () => {
  let server: any;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return players list', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/players',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('data');
    expect(response.json()).toHaveProperty('pagination');
  });
});
```

### 3. E2E Tests

```typescript
// tests/e2e/player-analytics.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Player Analytics', () => {
  test('should display player analytics dashboard', async ({ page }) => {
    await page.goto('/dashboard/players');

    // Check if player list is loaded
    await expect(page.locator('[data-testid="player-list"]')).toBeVisible();

    // Click on a player
    await page.click('[data-testid="player-card"]:first-child');

    // Check if analytics are displayed
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });
});
```

## Deployment

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
```

### 2. Database Migration

```bash
# Run migrations in production
yarn prisma migrate deploy

# Generate Prisma client
yarn prisma generate
```

### 3. Redis Configuration

```bash
# Use Upstash Redis for production
# Update REDIS_URL in environment variables
```

## Monitoring and Observability

### 1. Error Tracking

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Performance Monitoring

```typescript
// lib/analytics.ts
import { Analytics } from '@vercel/analytics';

export function trackEvent(event: string, properties?: Record<string, any>) {
  Analytics.track(event, properties);
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   ```bash
   # Check database connection
   yarn prisma db pull

   # Reset database
   yarn prisma migrate reset
   ```

2. **Redis Connection Issues**

   ```bash
   # Test Redis connection
   redis-cli ping

   # Check Redis logs
   redis-cli monitor
   ```

3. **Build Issues**

   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Reinstall dependencies
   rm -rf node_modules yarn.lock
   yarn install
   ```

### Getting Help

- Check the [documentation](./docs/)
- Review [API contracts](./contracts/)
- Join our [Discord community](https://discord.gg/mafia-insight)
- Create an issue on [GitHub](https://github.com/your-org/mafia-insight/issues)

## Next Steps

1. **Explore the codebase** - Start with the main dashboard components
2. **Run the tests** - Ensure everything is working correctly
3. **Check the API** - Review the OpenAPI specification
4. **Set up monitoring** - Configure error tracking and analytics
5. **Deploy to staging** - Test in a production-like environment

Welcome to the Sport Mafia Game Analytics platform! 🎮📊
