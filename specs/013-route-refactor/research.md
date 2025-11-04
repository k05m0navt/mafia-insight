# Research: Route and Database Refactoring

**Feature**: 013-route-refactor  
**Date**: 2025-01-27  
**Status**: Complete

## Research Objectives

1. Best practices for analyzing and removing unused routes/pages in Next.js App Router
2. Zero-downtime database migration techniques for PostgreSQL/Supabase
3. Code quality analysis tools for duplicate code detection and error handling coverage
4. WCAG 2.1 Level AA compliance verification tools and methods
5. Environment-based route gating patterns in Next.js

## Findings

### 1. Route and Page Analysis in Next.js App Router

**Decision**: Use static analysis and runtime checks for route/page usage analysis

**Rationale**:

- Next.js App Router uses file-system based routing, making static analysis feasible
- Navigation references can be found in navigation configuration files and component imports
- E2E test references indicate production usage
- Environment-based gating allows conditional route availability without code removal

**Alternatives Considered**:

- **Complete route removal**: Rejected - breaks E2E tests and development workflow
- **Build-time exclusion**: Rejected - too complex for Next.js App Router, requires custom webpack config
- **Middleware-only blocking**: Rejected - doesn't prevent route file from being accessible

**Implementation Approach**:

- Analyze navigation configuration files (`src/lib/navigation.ts`) for route references
- Search codebase for route imports and Link components pointing to routes
- Check E2E test files for route usage
- Use environment variable checks in route handlers for gating
- Static analysis tools (grep, AST parsing) for comprehensive reference detection

### 2. Zero-Downtime Database Migrations

**Decision**: Use PostgreSQL CONCURRENT index creation and staged table removal

**Rationale**:

- PostgreSQL supports `CREATE INDEX CONCURRENTLY` which doesn't lock tables
- Index creation is the most time-consuming operation and can be done without downtime
- Table removal requires careful foreign key constraint handling
- Supabase supports advisory locks to prevent concurrent migrations

**Alternatives Considered**:

- **Standard index creation**: Rejected - causes table locks and downtime
- **Maintenance windows**: Rejected - violates zero-downtime requirement
- **Replica-based migrations**: Rejected - overkill for this use case, requires complex setup

**Implementation Approach**:

- Use `CREATE INDEX CONCURRENTLY` for all new indexes
- Stage table removal: first remove foreign key constraints, then drop tables
- Use Supabase migration system with rollback scripts
- Verify migration success before committing
- Monitor query performance during and after migration

**Supabase Best Practices**:

- Use Supabase migration advisors to identify missing indexes
- Leverage Supabase MCP for migration execution
- Test migrations on staging environment first
- Use transaction rollback for failed migrations

### 3. Code Quality Analysis Tools

**Decision**: Use ESLint with custom rules, and specialized tools for duplication and coverage

**Rationale**:

- ESLint already integrated in project, can detect code patterns
- Code duplication tools (jscpd, SonarJS) provide quantitative metrics
- Error handling coverage requires custom analysis (try-catch blocks, error boundaries)
- Integration with existing test coverage tools provides unified metrics

**Alternatives Considered**:

- **Manual code review**: Rejected - not scalable, subjective
- **Single comprehensive tool**: Rejected - no single tool covers all metrics needed
- **External service (SonarQube)**: Rejected - adds complexity, can be done locally

**Implementation Approach**:

- **Code Duplication**: Use `jscpd` (JavaScript Copy/Paste Detector) for duplication analysis
  - Target: 30% reduction in duplication
  - Baseline measurement before refactoring
  - Re-measure after refactoring
- **Error Handling Coverage**: Custom analysis script
  - Scan for try-catch blocks, error boundaries, error handling in API routes
  - Target: 90% coverage of critical paths
  - Identify paths without error handling
- **Accessibility**: Use `@axe-core/playwright` and `pa11y` for WCAG compliance
  - Automated testing with axe-core
  - Manual verification with Lighthouse accessibility audit
  - Target: WCAG 2.1 Level AA compliance

### 4. WCAG 2.1 Level AA Compliance Verification

**Decision**: Automated testing with axe-core and manual verification with Lighthouse

**Rationale**:

- axe-core provides comprehensive accessibility testing
- Playwright integration allows E2E accessibility testing
- Lighthouse provides additional checks and scoring
- Manual testing ensures real-world accessibility

**Alternatives Considered**:

- **Manual testing only**: Rejected - not comprehensive, time-consuming
- **Single tool**: Rejected - different tools catch different issues
- **External service**: Rejected - can be done locally, better integration with CI

**Implementation Approach**:

- **Automated Testing**:
  - Use `@axe-core/playwright` in E2E tests
  - Run accessibility checks on all refactored pages
  - Fail tests if violations are found
- **Manual Verification**:
  - Lighthouse accessibility audit for each page
  - Keyboard navigation testing
  - Screen reader testing (if available)
- **Common Issues to Address**:
  - Missing alt text on images
  - Insufficient color contrast
  - Missing ARIA labels
  - Keyboard navigation support
  - Focus management

### 5. Environment-Based Route Gating

**Decision**: Use NODE_ENV checks in route handlers with Next.js middleware support

**Rationale**:

- NODE_ENV is standard Node.js convention, widely supported
- Next.js middleware can intercept requests before route handlers
- Environment checks are simple and performant
- Allows routes to remain in codebase for development/testing

**Alternatives Considered**:

- **Build-time exclusion**: Rejected - breaks development workflow, requires custom build config
- **Separate route files**: Rejected - adds complexity, harder to maintain
- **Feature flags**: Rejected - overkill for test routes, adds unnecessary complexity

**Implementation Approach**:

- Check `process.env.NODE_ENV === 'production'` in route handlers
- Return 404 or redirect for test routes in production
- Allow access in development/staging environments
- Middleware can also check environment for additional protection
- Document gated routes in code comments

**Pattern**:

```typescript
// Example: src/app/api/test-players/route.ts
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // ... rest of handler
}
```

### 6. Database Table Analysis and Removal

**Decision**: Multi-step analysis process before table removal

**Rationale**:

- Tables with zero rows may be used in code but not populated yet
- Foreign key relationships require careful handling
- Code references must be found before removal
- Planned features may need tables that appear unused

**Implementation Approach**:

1. **Code Reference Analysis**:
   - Search Prisma schema for model references
   - Search codebase for table/model imports
   - Check API routes for table usage
   - Verify no foreign key relationships exist
2. **Decision Matrix**:
   - If referenced in code → Keep and populate
   - If referenced in planned features → Keep and document
   - If no references and zero rows → Remove
3. **Removal Process**:
   - Remove foreign key constraints first
   - Create migration to drop table
   - Remove Prisma model
   - Update all code references
   - Verify E2E tests still pass

### 7. RLS Policy Optimization

**Decision**: Use `(select auth.<function>())` pattern for RLS policies

**Rationale**:

- Supabase advisors identified RLS policy performance issues
- Direct function calls in RLS policies are re-evaluated for each row
- Using `(select ...)` pattern evaluates once per query
- Significant performance improvement for queries returning many rows

**Implementation Approach**:

- Replace `auth.uid()` with `(select auth.uid())` in RLS policies
- Replace `current_setting('request.jwt.claims')` with `(select current_setting('request.jwt.claims'))`
- Test policy behavior remains correct
- Verify performance improvement
- Update policy documentation

## Tools and Libraries

### Required Tools

1. **Code Analysis**:
   - `jscpd` - Code duplication detection
   - ESLint with custom rules - Pattern detection
   - Custom scripts - Error handling coverage analysis

2. **Accessibility Testing**:
   - `@axe-core/playwright` - Automated accessibility testing
   - `lighthouse` - Accessibility auditing
   - `pa11y` (optional) - Additional accessibility checks

3. **Database**:
   - Prisma migrations - Schema changes
   - Supabase MCP - Database operations and advisors
   - PostgreSQL `CREATE INDEX CONCURRENTLY` - Zero-downtime indexes

4. **Analysis Scripts**:
   - Custom Node.js scripts for route/page reference analysis
   - AST parsing for code analysis (using `@babel/parser` or `ts-morph`)
   - Grep/ripgrep for text-based searches

### Integration Points

- **Next.js**: Environment variable checks, middleware, route handlers
- **Supabase**: Migration system, advisors, MCP tools
- **Prisma**: Schema management, migration generation
- **Testing**: Vitest for unit tests, Playwright for E2E and accessibility

## Risk Mitigation

### Risks Identified

1. **Removing routes/pages used by E2E tests**: Mitigated by checking test files before removal
2. **Breaking foreign key relationships**: Mitigated by removing constraints before tables
3. **Performance regression after index removal**: Mitigated by monitoring query performance
4. **Accessibility regression**: Mitigated by automated testing before/after refactoring
5. **Production downtime during migrations**: Mitigated by using CONCURRENT index creation

### Rollback Strategy

- All migrations have rollback scripts
- Code changes are feature-flagged where possible
- E2E tests verify functionality before/after changes
- Staged deployment allows gradual rollout

## Next Steps

1. Set up code analysis tools (jscpd, custom scripts)
2. Create analysis scripts for route/page references
3. Generate database migration scripts with CONCURRENT indexes
4. Set up accessibility testing in E2E suite
5. Create rollback procedures for all changes
