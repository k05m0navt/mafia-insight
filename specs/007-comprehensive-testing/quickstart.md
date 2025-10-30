# Quickstart Guide: Comprehensive User Flow Testing

**Feature**: 007-comprehensive-testing  
**Date**: 2025-01-27  
**Purpose**: Get started with the comprehensive testing framework quickly

## Prerequisites

### System Requirements

- Node.js 18+
- Yarn package manager
- Docker (for containerized testing)
- Git

### Browser Requirements

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Mobile Testing

- iOS Safari 14+
- Android Chrome 90+

## Installation

### 1. Install Dependencies

```bash
# Install testing framework dependencies
yarn add -D @playwright/test jest vitest @testing-library/react @testing-library/jest-dom
yarn add -D artillery lighthouse @owasp/zap2docker
yarn add -D @types/jest @types/node

# Install testing utilities
yarn add -D faker @faker-js/faker
yarn add -D dotenv cross-env
```

### 2. Configure Testing Tools

#### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### 3. Environment Setup

#### Environment Variables

```bash
# .env.test
TEST_BASE_URL=http://localhost:3000
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/mafia_insight_test
TEST_REDIS_URL=redis://localhost:6379/1
TEST_API_KEY=test-api-key
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=test-password
```

#### Test Database Setup

```bash
# Create test database
createdb mafia_insight_test

# Run migrations
yarn prisma migrate deploy --schema=./prisma/schema.prisma

# Seed test data
yarn prisma db seed --schema=./prisma/schema.prisma
```

## Quick Start Examples

### 1. Authentication Flow Testing

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );
  });
});
```

### 2. API Integration Testing

```typescript
// tests/integration/api/players.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestServer } from '../utils/test-server';

describe('Players API', () => {
  let server: any;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should return list of players', async () => {
    const response = await fetch('/api/players');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toBeInstanceOf(Array);
    expect(data.pagination).toBeDefined();
  });

  it('should filter players by search term', async () => {
    const response = await fetch('/api/players?search=john');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(
      data.players.every((player: any) =>
        player.name.toLowerCase().includes('john')
      )
    ).toBe(true);
  });
});
```

### 3. Component Unit Testing

```typescript
// tests/unit/components/PlayerCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PlayerCard } from '@/components/PlayerCard';

describe('PlayerCard', () => {
  const mockPlayer = {
    id: '1',
    name: 'John Doe',
    rating: 1500,
    gamesPlayed: 100,
    winRate: 0.65,
  };

  it('should render player information', () => {
    render(<PlayerCard player={mockPlayer} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('100 games')).toBeInTheDocument();
    expect(screen.getByText('65% win rate')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<PlayerCard player={mockPlayer} onClick={handleClick} />);

    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledWith(mockPlayer);
  });
});
```

### 4. Performance Testing

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: 'User Authentication Flow'
    weight: 30
    flow:
      - get:
          url: '/login'
      - post:
          url: '/api/auth/login'
          json:
            email: 'user@example.com'
            password: 'password123'
      - get:
          url: '/dashboard'

  - name: 'Analytics Data Loading'
    weight: 70
    flow:
      - get:
          url: '/players'
      - get:
          url: '/api/players'
      - get:
          url: '/api/analytics/leaderboard'
```

### 5. Security Testing

```bash
# Run OWASP ZAP security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -J zap-report.json \
  -r zap-report.html
```

## Running Tests

### All Tests

```bash
# Run all test suites
yarn test:all

# Run with coverage
yarn test:coverage
```

### Specific Test Types

```bash
# Unit tests
yarn test:unit

# Integration tests
yarn test:integration

# E2E tests
yarn test:e2e

# Performance tests
yarn test:performance

# Security tests
yarn test:security
```

### Specific Test Suites

```bash
# Authentication tests only
yarn test:e2e --grep "Authentication"

# API tests only
yarn test:integration --grep "API"

# Cross-browser tests
yarn test:e2e --project=chromium,firefox,webkit
```

## Test Data Management

### Using Anonymized Data

```typescript
// tests/fixtures/anonymized/players.json
{
  "players": [
    {
      "id": "anon_001",
      "name": "Player Alpha",
      "email": "player.alpha@example.com",
      "rating": 1500,
      "gamesPlayed": 100
    }
  ]
}
```

### Generating Synthetic Data

```typescript
// tests/utils/generate-test-data.ts
import { faker } from '@faker-js/faker';

export function generatePlayerData(count: number) {
  return Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    rating: faker.number.int({ min: 800, max: 2000 }),
    gamesPlayed: faker.number.int({ min: 0, max: 500 }),
  }));
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Comprehensive Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - run: yarn install --frozen-lockfile
      - run: yarn test:unit
      - run: yarn test:integration
      - run: yarn test:e2e
      - run: yarn test:performance
      - run: yarn test:security

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Monitoring and Reporting

### Test Results Dashboard

```typescript
// tests/utils/reporting.ts
export function generateTestReport(results: TestResults) {
  return {
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      passRate: (results.passed / results.total) * 100,
    },
    coverage: {
      lines: results.coverage.lines,
      functions: results.coverage.functions,
      branches: results.coverage.branches,
    },
    performance: {
      averageResponseTime: results.performance.avgResponseTime,
      p95ResponseTime: results.performance.p95ResponseTime,
    },
    security: {
      vulnerabilities: results.security.vulnerabilities,
      securityScore: results.security.score,
    },
  };
}
```

## Troubleshooting

### Common Issues

#### Test Timeouts

```typescript
// Increase timeout for slow tests
test.setTimeout(30000); // 30 seconds
```

#### Database Connection Issues

```bash
# Check database connection
yarn prisma db pull --schema=./prisma/schema.prisma
```

#### Browser Installation Issues

```bash
# Install Playwright browsers
yarn playwright install
```

#### Memory Issues

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" yarn test
```

### Debug Mode

```bash
# Run tests in debug mode
yarn test:e2e --debug

# Run specific test in debug mode
yarn test:e2e --grep "Authentication" --debug
```

## Next Steps

1. **Customize Test Data**: Modify test fixtures to match your specific requirements
2. **Add Custom Assertions**: Create domain-specific assertion helpers
3. **Implement Test Parallelization**: Configure parallel test execution for faster feedback
4. **Set Up Monitoring**: Integrate with monitoring tools for continuous test health tracking
5. **Expand Coverage**: Add more test scenarios based on your specific user flows

## Support

- **Documentation**: [Testing Framework Docs](./docs/)
- **API Reference**: [Testing API](./contracts/testing-api.yaml)
- **Data Model**: [Test Data Model](./data-model.md)
- **Issues**: Report issues in the project repository
- **Discussions**: Join team discussions for testing strategies
