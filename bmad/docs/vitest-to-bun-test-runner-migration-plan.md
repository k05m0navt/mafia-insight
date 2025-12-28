# Migration Plan: Vitest to Bun Test Runner

**Date**: 2025-01-27  
**Project**: mafia-insight  
**Status**: Future Reference  
**Estimated Effort**: 2-3 days  
**Risk Level**: Medium

---

## Executive Summary

This document outlines a migration plan for transitioning from Vitest to Bun's built-in test runner. The migration is **optional** and **not recommended for immediate implementation** since Vitest works perfectly with Bun as the runtime. This plan is provided for future reference when/if the team decides to leverage Bun's native test runner capabilities.

### Current State

- **Test Framework**: Vitest 1.0.0
- **Test Files**: 235+ test files
- **Vitest References**: 2,045+ instances across codebase
- **Coverage**: Vitest with v8 provider
- **Environment**: jsdom for DOM testing
- **Storybook Integration**: `@storybook/addon-vitest`

### Target State

- **Test Framework**: Bun's built-in test runner
- **Coverage**: Bun's native coverage reporting
- **Environment**: happy-dom (jsdom not compatible with Bun)
- **Storybook Integration**: May need alternative approach

---

## Why Consider Migration?

### Benefits

1. **Performance**: Bun's test runner is significantly faster
2. **Native Integration**: No separate test framework dependency
3. **Simplified Stack**: One less dependency to maintain
4. **Built-in Coverage**: Native coverage reporting without additional packages
5. **Better TypeScript Support**: Native TypeScript execution

### Drawbacks

1. **Migration Effort**: 2,045+ references to update
2. **API Differences**: Some Vitest-specific features may not have direct equivalents
3. **Storybook Integration**: May lose `@storybook/addon-vitest` support
4. **Learning Curve**: Team needs to learn Bun's test API
5. **Ecosystem**: Vitest has larger community and more plugins

---

## Migration Strategy

### Phase 1: Preparation & Assessment (4-6 hours)

#### 1.1 Inventory Current Usage

**Tasks**:

- [ ] Audit all test files for Vitest-specific features
- [ ] Document all `vi` mock usage patterns
- [ ] List all Vitest configuration options in use
- [ ] Identify Storybook integration points
- [ ] Document coverage thresholds and reporting needs

**Deliverables**:

- Complete inventory of Vitest usage
- List of Vitest-specific features in use
- Risk assessment for each feature

#### 1.2 Create Migration Branch

```bash
git checkout -b feat/migrate-to-bun-test-runner
```

#### 1.3 Set Up Bun Test Configuration

**Create `bunfig.toml`**:

```toml
[test]
# Enable coverage by default
coverage = true

# Coverage reporters
coverageReporter = ["text", "lcov", "html"]

# Coverage directory
coverageDir = "coverage"

# Preload happy-dom setup
preload = ["./tests/happy-dom-setup.ts"]

# Test timeout (30 seconds)
timeout = 30000
```

#### 1.4 Create Happy-DOM Setup File

**Create `tests/happy-dom-setup.ts`**:

```typescript
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@testing-library/jest-dom';

// Register happy-dom globals
GlobalRegistrator.register();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
```

**Install happy-dom**:

```bash
bun add -d happy-dom @testing-library/jest-dom
```

---

### Phase 2: Core Migration (1-2 days)

#### 2.1 Update Test Imports

**Pattern to Replace**:

```typescript
// OLD (Vitest)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// NEW (Bun)
import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  mock,
} from 'bun:test';
```

**Automated Script** (create `scripts/migrate-test-imports.ts`):

```typescript
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function migrateTestImports(dir: string) {
  const files = await readdir(dir, { recursive: true, withFileTypes: true });

  for (const file of files) {
    if (file.isFile() && /\.(test|spec)\.(ts|tsx)$/.test(file.name)) {
      const filePath = join(file.path, file.name);
      let content = await readFile(filePath, 'utf-8');

      // Replace imports
      content = content.replace(
        /import\s*{\s*([^}]+)\s*}\s*from\s*['"]vitest['"]/g,
        (match, imports) => {
          const newImports = imports
            .replace(/\bvi\b/g, 'mock')
            .replace(/\bit\b/g, 'test');
          return `import { ${newImports} } from 'bun:test'`;
        }
      );

      await writeFile(filePath, content);
    }
  }
}

migrateTestImports('./tests');
```

**Manual Review Required**:

- [ ] Review each file after automated replacement
- [ ] Check for edge cases
- [ ] Verify imports are correct

#### 2.2 Migrate Mocking API

**Pattern Mapping**:

| Vitest API           | Bun API          | Notes            |
| -------------------- | ---------------- | ---------------- |
| `vi.fn()`            | `mock.fn()`      | Function mocking |
| `vi.mock()`          | `mock.module()`  | Module mocking   |
| `vi.spyOn()`         | `mock.spyOn()`   | Object spying    |
| `vi.clearAllMocks()` | `mock.restore()` | Clear mocks      |
| `vi.resetAllMocks()` | `mock.restore()` | Reset mocks      |

**Example Migration**:

```typescript
// OLD (Vitest)
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

const mockFn = vi.fn();
vi.spyOn(console, 'log').mockImplementation(() => {});

// NEW (Bun)
import { mock } from 'bun:test';

mock.module('next/navigation', () => ({
  useRouter: () => ({
    push: mock.fn(),
    replace: mock.fn(),
  }),
}));

const mockFn = mock.fn();
mock.spyOn(console, 'log').mockImplementation(() => {});
```

**Files to Update**:

- [ ] `tests/setup.ts` - Global mocks
- [ ] `tests/__mocks__/*.ts` - Mock files
- [ ] All test files using `vi.*`

#### 2.3 Update Test Setup Files

**Update `tests/setup.ts`**:

```typescript
// Remove Vitest imports
// import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Add Bun imports
import { beforeAll, afterAll, beforeEach, afterEach, mock } from 'bun:test';
import '@testing-library/jest-dom';

// Remove JSDOM setup (handled by happy-dom preload)
// import { JSDOM } from 'jsdom';

// Update mocks to use Bun's mock API
mock.module('playwright', () => ({
  chromium: {
    launch: mock.fn(async () => new FakeBrowser()),
  },
}));

mock.module('next/navigation', () => {
  const router = {
    push: mock.fn(),
    replace: mock.fn(),
    prefetch: mock.fn(),
    back: mock.fn(),
    forward: mock.fn(),
    refresh: mock.fn(),
  };

  return {
    useRouter: () => router,
    usePathname: () => '',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  };
});
```

#### 2.4 Update Test Configuration

**Remove `vitest.config.ts`** (no longer needed)

**Update `package.json` scripts**:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:unit": "bun test tests/unit",
    "test:integration": "bun test tests/integration",
    "test:component": "bun test tests/components",
    "test:performance": "bun test tests/performance",
    "test:ci": "bun test --reporter=verbose --reporter=json --output-file=test-results.json",
    "test:coverage": "bun test --coverage",
    "test:coverage:ui": "bun test --coverage --coverage-reporter=html",
    "test:coverage:report": "bun test --coverage --coverage-reporter=lcov"
  }
}
```

---

### Phase 3: Feature-Specific Migrations (1 day)

#### 3.1 Coverage Configuration

**Bun Coverage Setup**:

```toml
# bunfig.toml
[test]
coverage = true
coverageReporter = ["text", "lcov", "html"]
coverageDir = "coverage"
```

**Coverage Thresholds** (may need custom script):

Bun doesn't have built-in coverage thresholds. Options:

1. Use external tool (e.g., `nyc` or custom script)
2. Parse coverage JSON and check thresholds manually
3. Accept that threshold checking moves to CI/CD

**Action Items**:

- [ ] Document coverage threshold requirements
- [ ] Create custom threshold checking script if needed
- [ ] Update CI/CD to handle coverage thresholds

#### 3.2 Test Environment Configuration

**Current (Vitest)**:

```typescript
// vitest.config.ts
environment: 'jsdom',
setupFiles: ['./tests/setup-env.ts', './tests/setup.ts'],
```

**New (Bun)**:

```toml
# bunfig.toml
[test]
preload = ["./tests/happy-dom-setup.ts", "./tests/setup-env.ts", "./tests/setup.ts"]
```

**Action Items**:

- [ ] Verify happy-dom provides all needed DOM APIs
- [ ] Test all DOM-dependent tests
- [ ] Update any jsdom-specific code

#### 3.3 Test Timeouts

**Current (Vitest)**:

```typescript
testTimeout: 30000,
hookTimeout: 30000,
teardownTimeout: 30000,
```

**New (Bun)**:

```toml
# bunfig.toml
[test]
timeout = 30000  # Single timeout for all operations
```

**Action Items**:

- [ ] Verify timeout behavior matches expectations
- [ ] Adjust timeout values if needed

#### 3.4 Test File Patterns

**Current (Vitest)**:

```typescript
include: [
  'tests/unit/**/*.test.{ts,tsx}',
  'tests/unit/**/*.spec.{ts,tsx}',
  // ...
];
```

**New (Bun)**:
Bun automatically discovers:

- `*.test.{js,jsx,ts,tsx}`
- `*_test.{js,jsx,ts,tsx}`
- `*.spec.{js,jsx,ts,tsx}`
- `*_spec.{js,jsx,ts,tsx}`

**Action Items**:

- [ ] Verify all test files match Bun's patterns
- [ ] Rename any non-standard test files

---

### Phase 4: Storybook Integration (4-6 hours)

#### 4.1 Assess Storybook Impact

**Current Setup**:

- Uses `@storybook/addon-vitest` for component testing
- May have Vitest-specific test files in stories

**Options**:

1. **Keep Vitest for Storybook Only**:
   - Use Bun for unit/integration tests
   - Keep Vitest for Storybook component tests
   - Requires maintaining both test runners

2. **Remove Storybook Test Integration**:
   - Remove `@storybook/addon-vitest`
   - Use Playwright for component testing instead
   - Simpler but loses Storybook test capabilities

3. **Wait for Bun Storybook Support**:
   - Monitor Bun ecosystem for Storybook integration
   - Defer Storybook migration until support exists

**Recommendation**: Option 1 (keep Vitest for Storybook) or Option 2 (remove Storybook tests)

**Action Items**:

- [ ] Audit Storybook test usage
- [ ] Decide on approach
- [ ] Update Storybook configuration if needed

---

### Phase 5: CI/CD Updates (2-4 hours)

#### 5.1 Update GitHub Actions

**Current (`.github/workflows/ci.yml`)**:

```yaml
- name: Unit tests
  run: bun run test:unit

- name: Test coverage
  run: bun run test:coverage
```

**Update to**:

```yaml
- name: Unit tests
  run: bun test tests/unit

- name: Test coverage
  run: bun test --coverage --coverage-reporter=lcov

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

**Action Items**:

- [ ] Update CI workflow
- [ ] Test coverage reporting in CI
- [ ] Verify coverage upload works

#### 5.2 Update Coverage Reporting

**If using Codecov or similar**:

- [ ] Verify lcov format compatibility
- [ ] Test coverage upload
- [ ] Update coverage badges if needed

---

### Phase 6: Testing & Validation (1 day)

#### 6.1 Run All Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test suites
bun test tests/unit
bun test tests/integration
bun test tests/components
```

**Action Items**:

- [ ] Run full test suite
- [ ] Fix any failing tests
- [ ] Verify all tests pass
- [ ] Check coverage reports

#### 6.2 Performance Comparison

**Benchmark**:

```bash
# Before (Vitest)
time bun run test

# After (Bun test runner)
time bun test
```

**Action Items**:

- [ ] Measure test execution time
- [ ] Document performance improvements
- [ ] Compare coverage generation time

#### 6.3 Edge Case Testing

**Test Scenarios**:

- [ ] Mocking complex modules
- [ ] Async test handling
- [ ] Snapshot testing
- [ ] Test isolation
- [ ] Parallel test execution

---

### Phase 7: Cleanup (2-4 hours)

#### 7.1 Remove Vitest Dependencies

**Remove from `package.json`**:

```json
{
  "devDependencies": {
    // Remove these:
    "vitest": "^1.0.0",
    "@vitest/browser": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@storybook/addon-vitest": "^10.1.9" // If removing Storybook integration
  }
}
```

**Action Items**:

- [ ] Remove Vitest packages
- [ ] Remove `vitest.config.ts`
- [ ] Update `.gitignore` if needed
- [ ] Clean up any Vitest-specific configs

#### 7.2 Update Documentation

**Files to Update**:

- [ ] `README.md` - Test commands
- [ ] `bmad/docs/technology-stack.md` - Testing section
- [ ] Any developer onboarding docs
- [ ] CI/CD documentation

#### 7.3 Update TypeScript Types

**Add Bun test types** (if using TypeScript):

```json
{
  "compilerOptions": {
    "types": ["bun-types"]
  }
}
```

Or add to test files:

```typescript
/// <reference types="bun-types/test-globals" />
```

---

## Migration Checklist

### Pre-Migration

- [ ] Create migration branch
- [ ] Backup current test setup
- [ ] Document all Vitest features in use
- [ ] Set up Bun test configuration
- [ ] Install happy-dom

### Core Migration

- [ ] Update all test imports
- [ ] Migrate all `vi` mocks to `mock`
- [ ] Update test setup files
- [ ] Replace jsdom with happy-dom
- [ ] Update test scripts in package.json

### Feature Migration

- [ ] Configure coverage reporting
- [ ] Set up coverage thresholds (if needed)
- [ ] Update test timeouts
- [ ] Verify test file patterns
- [ ] Handle Storybook integration

### CI/CD

- [ ] Update GitHub Actions workflow
- [ ] Test coverage reporting in CI
- [ ] Verify coverage upload works

### Testing

- [ ] Run full test suite
- [ ] Fix failing tests
- [ ] Performance benchmarking
- [ ] Edge case testing

### Cleanup

- [ ] Remove Vitest dependencies
- [ ] Remove vitest.config.ts
- [ ] Update documentation
- [ ] Update TypeScript types
- [ ] Code review
- [ ] Merge to main

---

## Risk Assessment

### High Risk Areas

1. **Mocking API Differences**
   - **Risk**: Bun's `mock` API may not have 1:1 parity with Vitest's `vi`
   - **Mitigation**: Create compatibility layer or update all mocks manually
   - **Impact**: Medium - May require significant refactoring

2. **Storybook Integration**
   - **Risk**: Loss of `@storybook/addon-vitest` support
   - **Mitigation**: Keep Vitest for Storybook or remove Storybook tests
   - **Impact**: Low - Storybook tests are optional

3. **Coverage Thresholds**
   - **Risk**: Bun doesn't support coverage thresholds natively
   - **Mitigation**: Use external tool or custom script
   - **Impact**: Low - Can be handled in CI/CD

### Medium Risk Areas

1. **Test Environment (jsdom → happy-dom)**
   - **Risk**: Some DOM APIs may differ
   - **Mitigation**: Test all DOM-dependent tests thoroughly
   - **Impact**: Medium - May require test updates

2. **Test Execution Order**
   - **Risk**: Bun may execute tests in different order
   - **Mitigation**: Ensure tests are properly isolated
   - **Impact**: Low - Tests should be isolated anyway

### Low Risk Areas

1. **Test API (describe, test, expect)**
   - **Risk**: Minimal - Bun uses Jest-compatible API
   - **Impact**: Low

2. **TypeScript Support**
   - **Risk**: Minimal - Bun has excellent TypeScript support
   - **Impact**: Low

---

## Rollback Plan

If migration encounters critical issues:

1. **Immediate Rollback**:

   ```bash
   git checkout main
   git branch -D feat/migrate-to-bun-test-runner
   ```

2. **Partial Rollback**:
   - Keep Bun test runner for new tests
   - Keep Vitest for existing tests
   - Gradually migrate over time

3. **Hybrid Approach**:
   - Use Bun for unit tests
   - Use Vitest for integration/component tests
   - Maintain both test runners

---

## Success Criteria

Migration is considered successful when:

1. ✅ All tests pass with Bun test runner
2. ✅ Coverage reporting works correctly
3. ✅ CI/CD pipeline passes
4. ✅ Test execution time is improved (or at least not degraded)
5. ✅ No loss of test functionality
6. ✅ Documentation is updated
7. ✅ Team is comfortable with new test runner

---

## Estimated Timeline

| Phase                      | Duration     | Dependencies |
| -------------------------- | ------------ | ------------ |
| Phase 1: Preparation       | 4-6 hours    | None         |
| Phase 2: Core Migration    | 1-2 days     | Phase 1      |
| Phase 3: Feature Migration | 1 day        | Phase 2      |
| Phase 4: Storybook         | 4-6 hours    | Phase 2      |
| Phase 5: CI/CD             | 2-4 hours    | Phase 3      |
| Phase 6: Testing           | 1 day        | Phase 5      |
| Phase 7: Cleanup           | 2-4 hours    | Phase 6      |
| **Total**                  | **2-3 days** |              |

---

## Alternative: Gradual Migration

Instead of a big-bang migration, consider a gradual approach:

1. **Phase 1**: Set up Bun test runner alongside Vitest
2. **Phase 2**: Migrate new tests to Bun
3. **Phase 3**: Gradually migrate existing tests
4. **Phase 4**: Remove Vitest once all tests migrated

**Benefits**:

- Lower risk
- Can test Bun test runner incrementally
- Easier rollback if issues arise

**Drawbacks**:

- Maintain two test runners temporarily
- More complex CI/CD setup

---

## References

- [Bun Test Documentation](https://bun.sh/docs/test)
- [Bun Test Migration Guide](https://bun.sh/docs/guides/test/migrate-from-jest)
- [Happy-DOM Setup](https://bun.sh/docs/guides/test/happy-dom)
- [Bun Coverage Reporting](https://bun.sh/docs/test/code-coverage)

---

## Decision Log

| Date       | Decision        | Rationale                                                               |
| ---------- | --------------- | ----------------------------------------------------------------------- |
| 2025-01-27 | Defer migration | Vitest works well with Bun; migration effort not justified at this time |
|            |                 | Plan created for future reference when/if migration is desired          |

---

**Document Status**: Future Reference  
**Last Updated**: 2025-01-27  
**Next Review**: When considering Bun test runner migration
