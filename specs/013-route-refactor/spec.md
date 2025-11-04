# Feature Specification: Route and Database Refactoring

**Feature Branch**: `013-route-refactor`  
**Created**: 2025-01-27  
**Status**: Draft  
**Input**: User description: "This is a list of routes, that the app have @zsh (204-295) . There is need to see, what routes the app do not needed and what need to refactor, what Supabase tables are needed and do not needed and also refactor. For that task, analyze the Prisma schema, Supabase, UX/UI. At the end, update the docs in @docs and update the @README.md . The next number of the feature is 013. use context7. use supabase mcp. use shadcn mcp. Also I would like to analyze the pages and remove the do not needed and refactor needed, if necessary. use context7. use shadcn mcp."

## Clarifications

### Session 2025-01-27

- Q: How should the system handle database migrations (adding indexes, removing tables) to minimize production impact? → A: All migrations use zero-downtime techniques with rollback plans
- Q: For tables with zero rows (`analytics`, `player_role_stats`, `regions`), what criteria should determine whether to remove them versus populate them? → A: Analyze code references and planned features; remove if unused, populate if referenced in code or planned
- Q: How should test routes be gated in production? → A: Environment-based conditional routing (check NODE_ENV or custom env var)
- Q: For incomplete API routes like `/api/users/invitations` (returns empty arrays with TODOs), what criteria should determine whether to implement the feature versus remove the route? → A: Analyze usage, planned features, and dependencies; implement if actively used or planned, remove otherwise
- Q: What accessibility standard should refactored pages meet? → A: WCAG 2.1 Level AA compliance
- Q: For SC-014 ("reduced code duplication, improved error handling"), what specific measurable thresholds should be used to verify improvements? → A: Code duplication reduced by at least 30%, error handling coverage improved to 90% of critical paths

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Remove Test Routes from Production (Priority: P1)

As a developer maintaining the application, I need to ensure test routes are not accessible in production environments to prevent security risks and confusion.

**Why this priority**: Test routes expose mock data and testing endpoints that should not be available to production users. This is a security and code quality concern.

**Independent Test**: Can be fully tested by verifying that test routes (`/test-players`, `/api/test-players`, `/api/test-db`) are either removed from production builds or properly gated behind environment checks, and that production builds do not include test-related code.

**Acceptance Scenarios**:

1. **Given** the application is running in production mode (NODE_ENV=production), **When** a user attempts to access `/test-players`, **Then** the route handler checks environment and returns 404 error or redirects to a valid page
2. **Given** the application is running in production mode (NODE_ENV=production), **When** a user attempts to access `/api/test-players`, **Then** the API route handler checks environment and returns 404 error or 403 Forbidden response
3. **Given** the application is running in development mode (NODE_ENV=development), **When** a developer accesses test routes, **Then** the environment check passes and routes function correctly for testing purposes
4. **Given** test routes are removed or gated, **When** E2E tests run, **Then** they use appropriate test data sources without relying on production-exposed test routes

---

### User Story 2 - Clean Up Unused Database Tables (Priority: P2)

As a database administrator, I need to identify and remove or populate unused database tables to reduce maintenance overhead and improve query performance.

**Why this priority**: Unused tables consume storage, add complexity to schema management, and may contain stale data that confuses developers.

**Independent Test**: Can be fully tested by verifying that tables with zero rows are either populated with data through import processes, or removed from the schema if they are truly unused, and that removal doesn't break existing functionality.

**Acceptance Scenarios**:

1. **Given** the `analytics` table has zero rows, **When** the system analyzes code references and planned features, **Then** it removes the table if unused or implements population logic if referenced in code or planned
2. **Given** the `player_role_stats` table has zero rows, **When** the system checks code references and import processes, **Then** it removes the table if unused or ensures import processes populate it correctly if referenced
3. **Given** the `regions` table has zero rows, **When** the system checks code references and application usage, **Then** it removes the table if unused or implements region data population during import if referenced
4. **Given** tables are identified as unused, **When** they are removed, **Then** all references to them are removed from code and migrations

---

### User Story 3 - Optimize Database Performance (Priority: P2)

As a system administrator, I need to optimize database query performance by adding missing indexes and removing unused indexes.

**Why this priority**: Missing indexes on foreign keys cause slow queries, and unused indexes waste storage and slow write operations.

**Independent Test**: Can be fully tested by verifying that foreign key columns have appropriate indexes, unused indexes are removed, and query performance improves for common operations.

**Acceptance Scenarios**:

1. **Given** foreign key columns lack indexes (as identified by Supabase advisors), **When** indexes are added to foreign keys in `clubs`, `players`, `games`, `tournaments`, and `player_tournaments` tables using zero-downtime techniques, **Then** queries joining these tables perform faster without service interruption
2. **Given** unused indexes exist on `notifications`, `email_logs`, and `data_integrity_reports` tables, **When** these indexes are removed, **Then** write operations to these tables are faster and storage is reduced
3. **Given** RLS policies on `users` table re-evaluate auth functions for each row, **When** policies are optimized to use `(select auth.<function>())`, **Then** query performance improves at scale

---

### User Story 4 - Refactor Incomplete API Routes (Priority: P3)

As a developer, I need to complete or remove incomplete API routes to ensure the API surface is clean and functional.

**Why this priority**: Incomplete routes return empty data or have TODO comments, which indicates unfinished features that may confuse API consumers.

**Independent Test**: Can be fully tested by verifying that routes like `/api/users/invitations` either return real data or are removed if the feature is not implemented, and that all API routes are properly documented.

**Acceptance Scenarios**:

1. **Given** the `/api/users/invitations` route returns an empty array with a TODO comment, **When** the system analyzes usage, planned features, and dependencies, **Then** it implements the invitation feature if actively used or planned, or removes the route otherwise
2. **Given** API routes have incomplete implementations, **When** they are analyzed for usage and planned features, **Then** they either return proper data (if implemented) or are removed (if unused and not planned)

---

### User Story 5 - Analyze and Clean Up Pages (Priority: P2)

As a developer maintaining the application, I need to identify unused or unnecessary pages and refactor pages that need improvement to reduce code complexity and improve maintainability.

**Why this priority**: Unused pages add maintenance overhead, confuse developers, and may expose unintended functionality. Pages that need refactoring create technical debt and reduce code quality.

**Independent Test**: Can be fully tested by verifying that pages are analyzed for usage, navigation references, and code quality; unused pages are removed or gated; and pages needing refactoring are improved.

**Acceptance Scenarios**:

1. **Given** pages exist in the application (e.g., `/test-players`, error pages, admin pages), **When** the system analyzes page usage through navigation references, route handlers, and code references, **Then** it identifies pages that are unused or unnecessary
2. **Given** pages are identified as unused (not referenced in navigation, not linked from other pages, not used by E2E tests), **When** they are removed or gated, **Then** all references to them are updated and no broken links remain
3. **Given** pages exist with code quality issues (duplicate code, poor error handling, missing accessibility features), **When** they are analyzed for refactoring needs, **Then** refactoring improvements are identified and implemented, ensuring refactored pages meet WCAG 2.1 Level AA accessibility compliance
4. **Given** test pages like `/test-players` exist, **When** they are analyzed, **Then** they are gated in production using environment-based routing (consistent with test route gating strategy)

---

### User Story 6 - Update Documentation (Priority: P3)

As a developer or user, I need accurate documentation that reflects the current state of routes, pages, and database schema.

**Why this priority**: Outdated documentation leads to confusion and wasted time when developers or users try to use features that don't exist or have changed.

**Independent Test**: Can be fully tested by verifying that route documentation matches actual routes, page documentation matches actual pages, database schema documentation matches Prisma schema, and README.md reflects current features and setup.

**Acceptance Scenarios**:

1. **Given** route documentation exists in `docs/technical/ROUTES.md`, **When** routes and pages are removed or refactored, **Then** the documentation is updated to reflect current routes and pages
2. **Given** the README.md describes features, routes, and pages, **When** the refactoring is complete, **Then** README.md is updated to remove references to removed routes/pages and update feature descriptions
3. **Given** database schema changes are made, **When** documentation is updated, **Then** schema documentation reflects the current state

---

### Edge Cases

- What happens when removing a table that has foreign key relationships? The system must handle cascading deletions or remove foreign key constraints first
- How does the system handle routes that are used only by E2E tests? They should be moved to test-only endpoints or use environment-based routing
- What if a table appears unused but is needed for future features? The system should document the intended use or mark it as "reserved for future use"
- How are production deployments affected when removing routes? The system must ensure no production code references removed routes
- What if removing an unused index causes performance issues later? The system should monitor query performance after removal
- What happens when a page is referenced in navigation but never actually used? The system should check actual usage patterns before removal
- How are pages that are only accessible via direct URL handled? The system should analyze both navigation references and direct access patterns
- What if a page appears unused but is needed for future features? The system should document intended use or mark as "reserved for future use"
- How does the system handle pages with code quality issues that don't break functionality? The system should prioritize refactoring based on impact and effort

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST gate test routes (`/test-players`, `/api/test-players`, `/api/test-db`) from production environments using environment-based conditional routing (checking NODE_ENV or custom environment variable)
- **FR-002**: System MUST analyze database tables with zero rows by checking code references and planned features; remove if unused and not planned, populate if referenced in active code or planned for future use
- **FR-003**: System MUST add indexes to all foreign key columns identified as missing indexes by Supabase performance advisors using zero-downtime techniques (e.g., CONCURRENT index creation)
- **FR-004**: System MUST remove unused indexes identified by Supabase performance advisors to improve write performance
- **FR-005**: System MUST optimize RLS policies on the `users` table to use `(select auth.<function>())` pattern instead of direct function calls
- **FR-006**: System MUST analyze incomplete API routes (e.g., `/api/users/invitations` that returns empty arrays) by checking usage, planned features, and dependencies; implement if actively used or planned, remove otherwise
- **FR-007**: System MUST update route documentation in `docs/technical/ROUTES.md` to reflect current routes after refactoring
- **FR-008**: System MUST update README.md to reflect current features, removed routes, and updated database schema information
- **FR-009**: System MUST ensure all route removals are backward compatible or provide appropriate deprecation notices
- **FR-010**: System MUST verify that removing tables or routes does not break existing functionality or E2E tests
- **FR-011**: System MUST analyze all pages in the application by checking navigation references, route handlers, code references, and E2E test usage to identify unused or unnecessary pages
- **FR-012**: System MUST remove or gate unused pages (pages not referenced in navigation, not linked from other pages, not used by tests) and update all references to prevent broken links
- **FR-013**: System MUST identify pages that need refactoring by analyzing code quality issues (duplicate code, poor error handling, missing accessibility features, performance issues)
- **FR-014**: System MUST refactor identified pages to improve code quality, maintainability, and user experience while preserving functionality, ensuring all refactored pages meet WCAG 2.1 Level AA accessibility compliance, achieve at least 30% reduction in code duplication, and improve error handling coverage to 90% of critical paths

### Key Entities _(include if feature involves data)_

- **Route**: A URL path in the application that serves content or API responses. Routes can be page routes (UI) or API routes (endpoints). Key attributes: path, authentication requirements, handler function, environment visibility
- **Page**: A user-facing UI component accessible via a route path. Pages render content and handle user interactions. Key attributes: path, component file, navigation visibility, authentication requirements, usage references. Relationships: linked from navigation menu, referenced by other pages, used by E2E tests
- **Database Table**: A structured data storage entity in Supabase/PostgreSQL. Key attributes: table name, row count, column definitions, foreign key relationships, indexes. Relationships: connected to other tables via foreign keys, referenced by application code
- **Database Index**: A performance optimization structure on database tables. Key attributes: index name, columns indexed, usage statistics. Relationships: belongs to a specific table, affects query and write performance
- **Test Route**: A route specifically for testing purposes using mock data. Key attributes: path, mock data source, environment visibility. Should only be available in development/test environments

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero test routes are accessible in production environments (100% of test routes gated or removed)
- **SC-002**: All identified unused database tables are either removed or populated with data (100% resolution of zero-row tables)
- **SC-003**: All foreign key columns have appropriate indexes (100% of identified missing foreign key indexes added)
- **SC-004**: All unused indexes identified by Supabase advisors are removed (100% removal of unused indexes)
- **SC-005**: RLS policy performance warnings are resolved (100% of identified RLS optimization issues fixed)
- **SC-006**: All incomplete API routes are either completed or removed (100% of routes with TODO/empty implementations resolved)
- **SC-007**: Route documentation is 100% accurate and matches actual routes in the application
- **SC-008**: README.md accurately reflects current features and does not reference removed routes or deprecated features
- **SC-009**: Database query performance improves by at least 20% for common join operations after adding foreign key indexes
- **SC-010**: E2E tests continue to pass after route and database refactoring (100% test pass rate maintained)
- **SC-011**: All unused pages are identified and either removed or gated (100% of unused pages resolved)
- **SC-012**: All pages needing refactoring are identified and improved (100% of identified refactoring needs addressed)
- **SC-013**: No broken links or references exist after page removal (0 broken links in navigation, code, or documentation)
- **SC-014**: Page code quality improves (code duplication reduced by at least 30%, error handling coverage improved to 90% of critical paths, WCAG 2.1 Level AA accessibility compliance achieved for all refactored pages)

## Assumptions

- Test routes are only needed in development/staging environments, not production
- Tables with zero rows that are not referenced in active code can be safely removed after analysis
- Adding indexes to foreign keys will improve query performance without significant write performance degradation
- Removing unused indexes will not cause issues because they are truly unused (verified by Supabase advisors)
- Incomplete API routes (returning empty data) can be safely removed if the feature is not actively being developed
- Documentation updates can be done incrementally as routes and tables are refactored
- E2E tests can be updated to use alternative test data sources if test routes are removed
- Pages can be analyzed for usage by checking navigation references, code imports, and link references
- Unused pages are those not referenced in navigation menus, not linked from other pages, and not used by E2E tests
- Pages needing refactoring can be identified through code analysis (duplicate code, error handling, accessibility, performance)

## Dependencies

- Access to Supabase database and advisors for performance recommendations
- Ability to run database migrations to add/remove indexes and tables
- Environment variable configuration to distinguish between development and production
- E2E test suite to verify functionality after refactoring
- Documentation files (docs/technical/ROUTES.md, README.md) that need updating
- Navigation configuration files to analyze page references
- Code analysis tools to identify duplicate code and quality issues

## Constraints

- Must not break existing production functionality
- Must maintain backward compatibility where possible, or provide deprecation notices
- Must ensure E2E tests continue to work after route removal
- Must follow Supabase best practices for database optimization
- Must preserve data integrity when removing tables (handle foreign key relationships)
- Must not remove tables or routes that are planned for future features
- All database migrations MUST use zero-downtime techniques (e.g., CONCURRENT index creation) with rollback plans to prevent service interruption

## Out of Scope

- Creating new routes or features (only refactoring existing ones)
- Implementing new database tables or complex schema changes
- Performance optimization beyond index management and RLS policies
- Complete rewrite of authentication or authorization system
- Changes to API response formats or data structures (only route removal/completion)
