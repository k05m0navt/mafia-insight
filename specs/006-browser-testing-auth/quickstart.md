# Quickstart: Browser Testing and Authentication UX Improvements

**Feature**: 006-browser-testing-auth  
**Date**: 2025-01-26  
**Purpose**: Get up and running with the enhanced authentication and navigation system

## Overview

This feature adds comprehensive Playwright testing coverage and improves the authentication UX with role-based navigation, theme controls, and real-time UI updates.

## Key Features

- ✅ **Comprehensive Playwright Testing**: Full E2E test coverage across all user flows
- ✅ **Role-Based Navigation**: Dynamic navigation based on user permissions
- ✅ **Theme Management**: Light/dark theme switching with persistence
- ✅ **Real-time Updates**: UI updates without page refresh
- ✅ **User-Friendly Errors**: Clear, helpful error messages
- ✅ **Permission Management**: Admin interface for managing page access

## Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- Supabase account for authentication
- Playwright browsers installed

## Installation

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Install Playwright browsers**:

   ```bash
   yarn playwright install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env.local
   # Configure your Supabase and database credentials
   ```

4. **Run database migrations**:
   ```bash
   yarn prisma migrate dev
   ```

## Quick Start Guide

### 1. Running Tests

**Run all Playwright tests**:

```bash
yarn playwright test
```

**Run specific test suites**:

```bash
# Authentication tests
yarn playwright test tests/e2e/auth

# Navigation tests
yarn playwright test tests/e2e/navigation

# Cross-browser tests
yarn playwright test --project=chromium --project=firefox --project=webkit
```

**Run tests in headed mode**:

```bash
yarn playwright test --headed
```

### 2. Authentication Flow

**Login as different user types**:

```typescript
// In your tests
await page.goto('/login');
await page.fill('[data-testid="email"]', 'admin@example.com');
await page.fill('[data-testid="password"]', 'password123');
await page.click('[data-testid="login-button"]');
```

**Test role-based access**:

```typescript
// Test admin access
await page.goto('/admin/permissions');
await expect(
  page.locator('[data-testid="permission-management"]')
).toBeVisible();

// Test user access (should redirect)
await page.goto('/admin/permissions');
await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
```

### 3. Navigation System

**Test navigation visibility**:

```typescript
// As admin user
await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();

// As regular user
await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
await expect(page.locator('[data-testid="nav-players"]')).toBeVisible();
```

**Test navigation updates**:

```typescript
// Change user role and verify navigation updates
await page.evaluate(() => {
  // Simulate role change
  window.dispatchEvent(
    new CustomEvent('roleChanged', { detail: { role: 'admin' } })
  );
});
await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
```

### 4. Theme Management

**Test theme switching**:

```typescript
// Switch to dark theme
await page.click('[data-testid="theme-toggle"]');
await expect(page.locator('html')).toHaveClass('dark');

// Verify persistence
await page.reload();
await expect(page.locator('html')).toHaveClass('dark');
```

**Test system preference detection**:

```typescript
// Set system preference to dark
await page.emulateMedia({ colorScheme: 'dark' });
await page.goto('/');
await expect(page.locator('html')).toHaveClass('dark');
```

### 5. Error Handling

**Test authentication errors**:

```typescript
// Invalid credentials
await page.fill('[data-testid="email"]', 'invalid@example.com');
await page.fill('[data-testid="password"]', 'wrongpassword');
await page.click('[data-testid="login-button"]');
await expect(page.locator('[data-testid="error-message"]')).toContainText(
  'Invalid credentials'
);
```

**Test access denied**:

```typescript
// Try to access restricted page
await page.goto('/admin/permissions');
await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
await expect(page.locator('[data-testid="suggested-actions"]')).toBeVisible();
```

## Development Workflow

### 1. Test-Driven Development

1. **Write failing test**:

   ```typescript
   test('should show admin navigation for admin users', async ({ page }) => {
     await loginAsAdmin(page);
     await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();
   });
   ```

2. **Run test to see it fail**:

   ```bash
   yarn playwright test --grep "should show admin navigation"
   ```

3. **Implement feature**:

   ```typescript
   // Add admin navigation component
   const AdminNav = () => {
     const { user } = useAuth();
     if (user?.role !== 'admin') return null;
     return <div data-testid="nav-admin">Admin</div>;
   };
   ```

4. **Run test to see it pass**:
   ```bash
   yarn playwright test --grep "should show admin navigation"
   ```

### 2. Component Development

**Create reusable components**:

```typescript
// Navigation component
const Navigation = () => {
  const { user, permissions } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav>
      <ProtectedComponent permission="read:players">
        <NavLink to="/players">Players</NavLink>
      </ProtectedComponent>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <AuthControls user={user} />
    </nav>
  );
};
```

### 3. State Management

**Use custom hooks for state**:

```typescript
// Theme hook
const useTheme = () => {
  const [theme, setTheme] = useState('system');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return { theme, toggleTheme };
};
```

## Testing Strategies

### 1. Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Test state management logic

### 2. Integration Tests

- Test component interactions
- Test API integrations
- Test authentication flows

### 3. E2E Tests

- Test complete user journeys
- Test cross-browser compatibility
- Test real-world scenarios

## Troubleshooting

### Common Issues

**Tests failing due to timing**:

```typescript
// Use proper waits
await page.waitForSelector('[data-testid="navigation"]');
await expect(page.locator('[data-testid="nav-item"]')).toBeVisible();
```

**Theme not persisting**:

```typescript
// Check localStorage
const theme = await page.evaluate(() => localStorage.getItem('theme'));
expect(theme).toBe('dark');
```

**Navigation not updating**:

```typescript
// Wait for state update
await page.waitForFunction(() => {
  return document.querySelector('[data-testid="nav-admin"]') !== null;
});
```

### Debug Mode

**Run tests in debug mode**:

```bash
yarn playwright test --debug
```

**Enable Playwright trace**:

```bash
yarn playwright test --trace on
```

## Next Steps

1. **Review test coverage**: Ensure all user flows are covered
2. **Performance testing**: Verify theme switching and navigation updates are fast
3. **Accessibility testing**: Ensure navigation is accessible
4. **User acceptance testing**: Validate with real users

## Support

- **Documentation**: See `/docs` directory for detailed guides
- **API Reference**: See `/contracts` directory for API specifications
- **Test Examples**: See `/tests` directory for test patterns
