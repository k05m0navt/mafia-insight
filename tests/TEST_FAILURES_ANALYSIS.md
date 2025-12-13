# Test Failures Analysis

## Summary

After running the test suite, several categories of test failures were identified. This document outlines the issues and recommended fixes.

## Fixed Issues ✅

### 1. ResizeObserver Not Defined

**Status:** ✅ Fixed  
**Files:** `tests/setup.ts`  
**Issue:** Radix UI components require ResizeObserver which isn't available in jsdom test environment.  
**Fix:** Added ResizeObserver mock to `tests/setup.ts`.

### 2. Password Reset Enumeration Test

**Status:** ✅ Fixed  
**Files:** `tests/integration/api/auth/forgot-password-enumeration.test.ts`  
**Issue:** Test was checking for `success` as top-level field, but it's stored in `details` JSON.  
**Fix:** Updated test to check `details.success`.

## Remaining Issues 🔴

### 1. auth.api.test.ts - Mock Service Tests Not Returning Values

**Status:** 🔴 Needs Refactoring  
**Files:** `tests/integration/auth/auth.api.test.ts`  
**Issue:** Tests are calling `mockAuthService.login()` but the mocks aren't configured to return values, so they return `undefined`. The tests expect responses like `{ success: false, error: 'Email is required' }` but get `undefined`.

**Root Cause:** The test file is structured to test a service layer, but:

- The mocks aren't set up to return expected values
- The tests aren't actually calling the Next.js route handlers
- The test structure doesn't match the actual implementation (Next.js App Router route handlers)

**Recommended Fix:**

1. Rewrite tests to call actual route handlers (like `forgot-password.test.ts` does)
2. Use `NextRequest` and `NextResponse` instead of Express-style mocks
3. Mock dependencies (Prisma, Supabase, etc.) at the module level

**Example Pattern (from working tests):**

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

const request = new NextRequest('http://localhost:3000/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
  headers: { 'Content-Type': 'application/json' },
});

const response = await POST(request);
const data = await response.json();
expect(response.status).toBe(200);
expect(data.success).toBe(true);
```

### 2. api-endpoints.test.ts - URL Parsing Errors

**Status:** 🔴 Needs Refactoring  
**Files:** `tests/integration/api/api-endpoints.test.ts`  
**Issue:** Tests use `fetch()` with relative URLs like `/api/auth/login` which fail with "Failed to parse URL".

**Root Cause:** `fetch()` requires absolute URLs or a running server. The test setup doesn't provide either.

**Recommended Fix:**

1. Use Next.js route handlers directly (like password reset tests)
2. Or set up a test server using `next-test-server` or similar
3. Or use absolute URLs: `fetch('http://localhost:3000/api/auth/login', ...)`

### 3. auth.service.test.ts - Service Tests Not Properly Structured

**Status:** 🔴 Needs Investigation  
**Files:** `tests/integration/auth/auth.service.test.ts`  
**Issue:** All 22 tests failing with "expected undefined to deeply equal { success: true, ... }"

**Root Cause:** Similar to `auth.api.test.ts` - tests are calling mocked services that don't return values.

**Recommended Fix:**

1. Check if `AuthService` class exists and is properly exported
2. Ensure mocks are configured to return expected values
3. Or refactor to test actual service implementation

### 4. OAuthButtons.test.tsx - Console Error Assertion

**Status:** 🟡 Minor Issue  
**Files:** `tests/components/auth/OAuthButtons.test.tsx`  
**Issue:** Test waits for `console.error` to be called, but it may not be called in all scenarios.

**Recommended Fix:**

1. Make the console.error assertion optional or more flexible
2. Or ensure the error path is properly triggered in the test

### 5. LoginForm.test.tsx - Keyboard Navigation Tests

**Status:** 🟡 Minor Issue  
**Files:** `tests/unit/components/auth/LoginForm.test.tsx`  
**Issue:** Some keyboard navigation tests failing (focus management).

**Recommended Fix:**

1. Review focus management implementation
2. Ensure proper tab order in the component
3. May need to adjust test expectations

### 6. Import and Cron Tests

**Status:** 🟡 Needs Investigation  
**Files:** Various import and cron-related test files  
**Issue:** Some tests failing due to missing data or incorrect expectations.

**Recommended Fix:**

1. Review test setup for import/cron tests
2. Ensure proper mocking of external dependencies
3. Check test data fixtures

## Priority

1. **High Priority:** Fix `auth.api.test.ts` and `auth.service.test.ts` - These are core authentication tests
2. **Medium Priority:** Fix `api-endpoints.test.ts` - Integration tests for API endpoints
3. **Low Priority:** Fix component test edge cases (OAuthButtons, LoginForm keyboard nav)

## Test Results Summary

- **Password Reset Tests:** ✅ 49/49 passing
- **Total Test Suite:** ~1277 passing, ~326 failing
- **Main Failure Categories:**
  - Auth API integration tests: 11 failed
  - Auth service tests: 22 failed
  - API endpoint tests: 32 failed
  - Import tests: 18 failed
  - Component tests: Various failures

## Next Steps

1. ✅ ResizeObserver mock added
2. ✅ Password reset enumeration test fixed
3. 🔄 Refactor `auth.api.test.ts` to use actual route handlers
4. 🔄 Fix `api-endpoints.test.ts` URL parsing
5. 🔄 Investigate and fix `auth.service.test.ts`
6. 🔄 Review and fix component test edge cases
