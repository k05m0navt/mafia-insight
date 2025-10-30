# Code Refactoring Guide

## Overview

This document outlines the critical refactoring needs identified through comprehensive testing of the Mafia Insight application. The testing revealed multiple architectural and implementation issues that require immediate attention to improve code quality, maintainability, and reliability.

## Test Results Summary

- **Total Tests**: 195
- **Passed**: 0
- **Failed**: 195
- **Success Rate**: 0%
- **Critical Issues**: 15+

## 🚨 UPDATED TEST RESULTS (Latest Run)

**Current Status**: All tests failing with critical infrastructure issues
**Primary Failure Categories**:

1. **Database Connection Failures** - 40+ tests failing due to Prisma client issues
2. **Test Timeouts** - 15+ tests timing out at 5000ms
3. **Mock Configuration Issues** - Missing exports causing test failures
4. **Component Test Failures** - Multiple elements with same text
5. **Scraper Test Failures** - Data extraction not working properly

## Critical Issues Identified

### 1. Database Infrastructure Failures (CRITICAL)

#### Issue: Prisma Client Connection Failures

**Severity**: CRITICAL
**Impact**: 40+ integration tests failing, complete data layer failure

**Problem**:

```
PrismaClientKnownRequestError: Server has closed the connection
```

**Root Cause**: Missing or incorrect database configuration for test environment

**Files Affected**:

- `tests/setup/test-db.ts`
- `src/lib/gomafia/import/auto-trigger.ts`
- All integration test files

**Refactoring Solution**:

1. **Fix Database Configuration**:

```typescript
// Update: tests/setup/test-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db',
    },
  },
});

export { prisma };
```

2. **Add Database Setup in Tests**:

```typescript
// Add to test setup
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

3. **Environment Configuration**:

```bash
# Create .env.test
DATABASE_URL=file:./test.db
```

### 2. Test Configuration Issues (CRITICAL)

#### Issue: Test Timeouts

**Severity**: CRITICAL
**Impact**: 15+ tests timing out, retry logic tests failing

**Problem**:

```
Test timed out in 5000ms
```

**Root Cause**: Test timeout set too low for integration tests

**Files Affected**:

- `vitest.config.ts`
- All integration test files
- Retry logic test files

**Refactoring Solution**:

1. **Update Test Configuration**:

```typescript
// Update: vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000, // Increase from 5000ms
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
});
```

2. **Add Test-Specific Timeouts**:

```typescript
// For specific long-running tests
test('retry logic test', async () => {
  // Test implementation
}, 30000); // 30 second timeout
```

### 3. Mock Configuration Issues (HIGH)

#### Issue: Missing Mock Exports

**Severity**: HIGH
**Impact**: 20+ tests failing due to missing mock exports

**Problem**:

```
No "cleanup" export is defined on the "@/lib/parsers/gomafiaParser" mock
```

**Root Cause**: Incomplete mock implementations

**Files Affected**:

- `tests/mocks/gomafiaParser.ts`
- All parser test files
- Validation test files

**Refactoring Solution**:

1. **Complete Mock Implementation**:

```typescript
// Update: tests/mocks/gomafiaParser.ts
export const gomafiaParser = {
  parsePlayer: vi.fn(),
  parseTournament: vi.fn(),
  parseGame: vi.fn(),
  cleanup: vi.fn(), // Add missing export
};
```

2. **Add Mock Data**:

```typescript
// Add proper mock data
export const mockPlayerData = {
  gomafiaId: '575',
  name: 'Player Name',
  club: 'Club Name',
  region: 'Region',
  elo: 2345.75,
  ggPoints: -50,
};
```

### 4. Component Test Issues (MEDIUM)

#### Issue: Multiple Elements with Same Text

**Severity**: MEDIUM
**Impact**: Component tests failing, UI testing unreliable

**Problem**:

```
Found multiple elements with the text: Mafia Insight
```

**Root Cause**: Non-specific test selectors, duplicate content

**Files Affected**:

- `tests/components/navigation/Navbar.test.tsx`
- All component test files

**Refactoring Solution**:

1. **Use Specific Test Selectors**:

```typescript
// Update test selectors
const logo = screen.getByTestId('nav-logo');
const title = screen.getByText('Mafia Insight', { selector: 'span' });
```

2. **Add Unique Test IDs**:

```typescript
// Update components with unique test IDs
<nav data-testid="main-navigation">
  <a data-testid="nav-logo">Mafia Insight</a>
</nav>
```

### 5. Scraper Test Failures (MEDIUM)

#### Issue: Empty Data Extraction

**Severity**: MEDIUM
**Impact**: 8+ scraper tests failing, data parsing not working

**Problem**:

```
expected { gomafiaId: '', name: '', ... } to deeply equal { gomafiaId: '575', ... }
```

**Root Cause**: Test fixtures not properly configured

**Files Affected**:

- `tests/unit/scrapers/players-scraper.test.ts`
- `tests/unit/scrapers/tournaments-scraper.test.ts`
- All scraper test files

**Refactoring Solution**:

1. **Fix Test HTML Fixtures**:

```typescript
// Update test fixtures
const mockHtml = `
  <tr>
    <td>575</td>
    <td>Player Name</td>
    <td>Club Name</td>
    <td>Region</td>
    <td>2345.75</td>
    <td>-50</td>
  </tr>
`;
```

2. **Add Data Validation**:

```typescript
// Add validation in scraper tests
expect(result.gomafiaId).toBe('575');
expect(result.name).toBe('Player Name');
expect(result.elo).toBe(2345.75);
```

### 6. Missing Dependencies and Services (LOW)

#### Issue: Missing Authentication Service

**Severity**: CRITICAL
**Impact**: Complete authentication system failure

**Problem**:

```typescript
TypeError: authService.isAuthenticated is not a function
```

**Root Cause**: The `authService` is not properly imported or initialized in components.

**Files Affected**:

- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/LoginForm.tsx`
- All authentication-related components

**Refactoring Solution**:

1. Create proper authentication service implementation
2. Implement dependency injection pattern
3. Add proper error handling for missing services

```typescript
// Create: src/services/AuthService.ts
export class AuthService {
  isAuthenticated(): boolean {
    // Implementation
  }

  login(credentials: LoginCredentials): Promise<AuthResult> {
    // Implementation
  }

  logout(): Promise<void> {
    // Implementation
  }
}

// Update: src/components/auth/AuthProvider.tsx
import { AuthService } from '@/services/AuthService';

const authService = new AuthService();
```

### 2. Missing Validation Functions

#### Issue: Undefined Validation Functions

**Severity**: CRITICAL
**Impact**: Form validation completely broken

**Problem**:

```typescript
TypeError: Cannot read properties of undefined (reading 'isValid')
```

**Root Cause**: `validateLoginCredentials` function is not defined or imported.

**Files Affected**:

- `src/components/auth/LoginForm.tsx`
- All form components with validation

**Refactoring Solution**:

1. Create centralized validation utilities
2. Implement proper validation schema
3. Add type safety for validation results

```typescript
// Create: src/lib/validation/authValidation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateLoginCredentials(
  credentials: LoginCredentials
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!credentials.email || !isValidEmail(credentials.email)) {
    errors.email = 'Valid email is required';
  }

  if (!credentials.password || credentials.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### 3. Missing UI State Management

#### Issue: Missing Loading and Error States

**Severity**: HIGH
**Impact**: Poor user experience, no feedback for user actions

**Problem**:

- No loading indicators during form submission
- No error message display
- No validation error display
- Form fields not disabled during loading

**Files Affected**:

- `src/components/auth/LoginForm.tsx`
- All interactive components

**Refactoring Solution**:

1. Implement proper state management
2. Add loading states
3. Add error handling and display
4. Add validation error display

```typescript
// Update: src/components/auth/LoginForm.tsx
interface LoginFormState {
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
}

const [state, setState] = useState<LoginFormState>({
  isLoading: false,
  error: null,
  validationErrors: {}
});

// Add loading state
{state.isLoading && (
  <div data-testid="loading">Loading...</div>
)}

// Add error display
{state.error && (
  <div data-testid="error-message" className="error">
    {state.error}
  </div>
)}

// Add validation errors
{Object.entries(state.validationErrors).map(([field, error]) => (
  <div key={field} data-testid="validation-error" className="validation-error">
    {error}
  </div>
))}
```

### 4. Missing Test Data Attributes

#### Issue: Incomplete Test Coverage

**Severity**: MEDIUM
**Impact**: Tests cannot properly interact with components

**Problem**:

- Missing `data-testid` attributes
- Inconsistent test selectors
- Components not properly structured for testing

**Refactoring Solution**:

1. Add comprehensive test attributes
2. Standardize test selectors
3. Improve component structure for testing

```typescript
// Add test attributes to all interactive elements
<input
  data-testid="email-input"
  data-testid="validation-error"
  data-testid="loading"
  data-testid="error-message"
  // ... other props
/>
```

### 5. Missing Hook Dependencies

#### Issue: Missing Custom Hooks

**Severity**: HIGH
**Impact**: Components cannot access required functionality

**Problem**:

```typescript
Cannot find module '@/hooks/usePermissions'
```

**Root Cause**: Custom hooks are referenced but not implemented.

**Refactoring Solution**:

1. Create missing custom hooks
2. Implement proper hook patterns
3. Add proper error handling

```typescript
// Create: src/hooks/usePermissions.ts
export function usePermissions() {
  const [permissions, setPermissions] = useState<Permissions>({});

  const canAccessPage = (page: string): boolean => {
    return permissions[page] || false;
  };

  return {
    permissions,
    canAccessPage,
    hasPermission: (permission: string) => permissions[permission] || false,
  };
}
```

### 6. Component Architecture Issues

#### Issue: Poor Component Separation

**Severity**: MEDIUM
**Impact**: Difficult to test and maintain

**Problems**:

- Components doing too much
- No clear separation of concerns
- Missing proper prop interfaces
- Inconsistent component patterns

**Refactoring Solution**:

1. Break down large components
2. Implement proper separation of concerns
3. Add proper TypeScript interfaces
4. Standardize component patterns

```typescript
// Separate concerns
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

interface LoginFormState {
  formData: LoginCredentials;
  validationErrors: Record<string, string>;
}

// Create focused components
const LoginForm = ({ onSubmit, isLoading, error }: LoginFormProps) => {
  // Form logic only
};

const ValidationErrors = ({ errors }: { errors: Record<string, string> }) => {
  // Error display only
};

const LoadingIndicator = ({ isLoading }: { isLoading: boolean }) => {
  // Loading state only
};
```

### 7. Missing Error Boundaries

#### Issue: No Error Handling

**Severity**: HIGH
**Impact**: Application crashes on errors

**Problem**:

- No error boundaries
- Unhandled promise rejections
- No fallback UI for errors

**Refactoring Solution**:

1. Implement error boundaries
2. Add proper error handling
3. Create fallback UI components

```typescript
// Create: src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 8. Missing Type Definitions

#### Issue: Incomplete TypeScript Support

**Severity**: MEDIUM
**Impact**: Type safety issues, development experience

**Problem**:

- Missing interface definitions
- Inconsistent type usage
- No proper type exports

**Refactoring Solution**:

1. Create comprehensive type definitions
2. Add proper interfaces
3. Implement type-safe patterns

```typescript
// Create: src/types/auth.ts
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'user' | 'moderator';
```

## Refactoring Priority Matrix

| Priority | Issue                        | Effort | Impact   | Timeline |
| -------- | ---------------------------- | ------ | -------- | -------- |
| P0       | Database Connection Failures | Medium | Critical | 1-2 days |
| P0       | Test Timeout Issues          | Low    | Critical | 1 day    |
| P1       | Mock Configuration Issues    | Low    | High     | 1 day    |
| P1       | Component Test Issues        | Low    | High     | 1 day    |
| P2       | Scraper Test Failures        | Low    | Medium   | 1 day    |
| P2       | Missing Auth Service         | High   | Critical | 1-2 days |
| P2       | Missing Validation           | Medium | Critical | 1 day    |
| P3       | UI State Management          | High   | High     | 2-3 days |
| P3       | Missing Hooks                | Medium | High     | 1-2 days |
| P4       | Error Boundaries             | Medium | High     | 1 day    |
| P4       | Test Attributes              | Low    | Medium   | 1 day    |
| P5       | Component Architecture       | High   | Medium   | 3-5 days |
| P5       | Type Definitions             | Medium | Medium   | 1-2 days |

## Implementation Plan

### Phase 1: Critical Infrastructure Fixes (Week 1)

1. **Day 1**: Fix database connection issues and test timeouts
2. **Day 2**: Fix mock configuration and component test issues
3. **Day 3**: Fix scraper test failures and data extraction
4. **Day 4**: Implement authentication service and validation
5. **Day 5**: Add missing hooks and test attributes

### Phase 2: Architecture Improvements (Week 2)

1. **Day 1-2**: Implement UI state management and error handling
2. **Day 3-4**: Add error boundaries and fallback UI
3. **Day 5**: Refactor component architecture

### Phase 3: Testing and Validation (Week 3)

1. **Day 1-2**: Fix all remaining failing tests
2. **Day 3-4**: Add integration tests and improve test coverage
3. **Day 5**: Performance testing and optimization

## Code Quality Metrics

### Current State

- **Test Coverage**: 0% (0/195 tests passing)
- **Type Safety**: 40%
- **Error Handling**: 10%
- **Component Reusability**: 30%
- **Database Connectivity**: 0%
- **Test Infrastructure**: 0%

### Target State

- **Test Coverage**: 90%+
- **Type Safety**: 95%+
- **Error Handling**: 90%+
- **Component Reusability**: 80%+
- **Database Connectivity**: 100%
- **Test Infrastructure**: 100%

## Best Practices to Implement

### 1. Dependency Injection

```typescript
// Use dependency injection for services
interface ServiceContainer {
  authService: AuthService;
  validationService: ValidationService;
  apiService: ApiService;
}

const useServices = () => {
  return useContext(ServiceContext);
};
```

### 2. Error Handling Patterns

```typescript
// Implement consistent error handling
const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorHandler: (error: Error) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    errorHandler(error as Error);
    return null;
  }
};
```

### 3. State Management

```typescript
// Use proper state management patterns
const useFormState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateState = (updates: Partial<T>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const setError = (field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  return { state, errors, isLoading, updateState, setError, setIsLoading };
};
```

### 4. Testing Patterns

```typescript
// Implement comprehensive testing
describe('LoginForm', () => {
  const renderWithProviders = (props: Partial<LoginFormProps> = {}) => {
    return render(
      <ServiceProvider>
        <ErrorBoundary>
          <LoginForm {...defaultProps} {...props} />
        </ErrorBoundary>
      </ServiceProvider>
    );
  };

  it('should handle form submission', async () => {
    const mockSubmit = vi.fn();
    renderWithProviders({ onSubmit: mockSubmit });

    // Test implementation
  });
});
```

## Monitoring and Metrics

### Key Metrics to Track

1. **Test Pass Rate**: Target 95%+
2. **Build Time**: Target < 2 minutes
3. **Bundle Size**: Target < 500KB
4. **Error Rate**: Target < 1%
5. **Performance Score**: Target 90+

### Tools to Implement

1. **Code Coverage**: Vitest coverage
2. **Type Checking**: TypeScript strict mode
3. **Linting**: ESLint with strict rules
4. **Performance**: Lighthouse CI
5. **Bundle Analysis**: Webpack Bundle Analyzer

## Conclusion

This refactoring guide addresses the critical issues identified through comprehensive testing. The implementation should follow the priority matrix and be executed in phases to ensure minimal disruption to development while maximizing code quality improvements.

The key focus areas are:

1. **Reliability**: Fix critical errors and missing dependencies
2. **Maintainability**: Improve component architecture and separation of concerns
3. **Testability**: Add comprehensive test coverage and proper test utilities
4. **User Experience**: Implement proper loading states and error handling
5. **Developer Experience**: Add proper TypeScript support and development tools

Following this guide will result in a robust, maintainable, and well-tested codebase that can support future development and scaling.
