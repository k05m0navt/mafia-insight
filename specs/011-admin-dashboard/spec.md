# Feature Specification: Admin Dashboard & Import Controls

**Feature Branch**: `011-admin-dashboard`  
**Created**: January 27, 2025  
**Status**: Draft  
**Input**: User description: "Nex, I would like to create an admin dashboard. Also, I need to have an easy way to stop the current import, also, I need to have a way to clear the DB to start the fresh import. Also, right now, the dark theme is look awfull, you need to get the best practicies to create dark theme for that type of apps."

## Clarifications

### Session 2025-01-27

- Q: What should the "Clear Database" operation preserve when resetting the database? → A: Preserve all User accounts (both regular users and admin users, since they share the same User table), preserve SyncLog/SyncStatus/ImportCheckpoint/ImportProgress tables for audit history, preserve Region reference data, preserve Notification/DataIntegrityReport/EmailLog tables for system operations history, but delete all imported game data including Player/Club/Game/Tournament/GameParticipation/PlayerRoleStats/PlayerYearStats/PlayerTournament/Analytics tables to enable fresh import

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Comprehensive Admin Dashboard (Priority: P1)

As an administrator, I want access to a centralized dashboard that provides at-a-glance system health, import status, data metrics, and quick access to common administrative tasks, so I can efficiently monitor and manage the platform.

**Why this priority**: The admin dashboard serves as the primary interface for platform management. Without a cohesive dashboard, administrators must navigate multiple pages to gather information, reducing operational efficiency and situational awareness.

**Independent Test**: Can be fully tested by logging in as an admin, accessing the dashboard, and verifying that all key metrics, system status indicators, and quick actions are displayed correctly and respond to user interactions.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator, **When** they navigate to the admin dashboard, **Then** they see system health metrics (database status, sync status, error counts), recent activity summaries, and quick action cards
2. **Given** the admin dashboard is displayed, **When** administrators view the import status section, **Then** they see current import progress, last sync time, next scheduled sync, and any import errors
3. **Given** the admin dashboard with system alerts, **When** administrators view alerts, **Then** they see critical issues, warnings, and information messages with appropriate severity indicators
4. **Given** the admin dashboard displays quick action buttons, **When** administrators click these buttons, **Then** they are redirected to relevant administrative pages (User Management, Import Controls, Settings, etc.)

---

### User Story 2 - Import Cancellation (Priority: P1)

As an administrator managing data imports, I want the ability to stop a running import operation safely and immediately, so I can prevent resource waste or data corruption when issues are detected.

**Why this priority**: Import operations can run for hours and consume significant resources. The ability to stop imports is critical for operational control and cost management, especially in cloud environments where resources translate directly to costs.

**Independent Test**: Can be fully tested by starting an import, clicking the stop button, and verifying that the import terminates gracefully, locks are released, partial data is saved or rolled back appropriately, and the system status updates reflect the cancellation.

**Acceptance Scenarios**:

1. **Given** an import operation is in progress, **When** an administrator clicks the "Stop Import" button, **Then** they see a confirmation dialog with information about what will happen (e.g., "Partial data will be saved")
2. **Given** the administrator confirms the stop action, **When** the cancellation is initiated, **Then** the import operation terminates gracefully, all locks are released, and the UI updates to show "Import cancelled by admin" status
3. **Given** an administrator attempts to stop a non-existent import, **When** they click stop, **Then** they see an appropriate message indicating no import is currently running
4. **Given** a cancelled import is resumed later, **When** administrators retry the import, **Then** the system resumes from the last successful checkpoint without creating duplicate records

---

### User Story 3 - Database Clear for Fresh Import (Priority: P1)

As an administrator, I want the ability to clear the database completely and start a fresh import, so I can reset the platform to a clean state when data becomes corrupted, inconsistent, or when major changes require complete re-import.

**Why this priority**: Data integrity issues occasionally require a complete reset. Without this capability, administrators cannot recover from severe data corruption or schema mismatches, potentially requiring manual database intervention.

**Independent Test**: Can be fully tested by confirming the clear action, verifying the database is emptied, attempting to trigger a fresh import, and confirming all data is re-imported successfully from scratch.

**Acceptance Scenarios**:

1. **Given** an administrator needs to clear the database, **When** they navigate to the Import Controls page and click "Clear Database", **Then** they see a strong warning dialog requiring confirmation and explaining all imported game data will be permanently deleted while user accounts and system configuration are preserved
2. **Given** the administrator confirms the clear action, **When** the clear operation completes, **Then** all imported game data (players, games, tournaments, clubs, etc.) is removed while user accounts, audit logs, and system configuration remain intact, and the admin receives confirmation with option to start fresh import
3. **Given** the database is cleared, **When** administrators start a new import, **Then** the system imports all historical data from gomafia.pro as if it were the first import
4. **Given** an administrator attempts to clear the database while an import is running, **When** they initiate the clear, **Then** they see an error message requiring them to stop the import first

---

### User Story 4 - Professional Dark Theme (Priority: P2)

As a user who prefers dark mode, I want a well-designed dark theme that applies modern best practices for dark mode interfaces, so I can comfortably use the application in low-light conditions with reduced eye strain and professional appearance.

**Why this priority**: Dark mode is a modern UX expectation. The current implementation reportedly looks unprofessional, which impacts user satisfaction and platform credibility. This should be addressed to meet contemporary design standards, though it's not blocking core functionality.

**Independent Test**: Can be fully tested by enabling dark mode, navigating through all major pages and components, and verifying that text is readable, contrast ratios meet accessibility standards, interactive elements are clearly visible, and the overall appearance is polished and professional.

**Acceptance Scenarios**:

1. **Given** a user enables dark theme, **When** they navigate throughout the application, **Then** all pages display with proper dark mode colors, readable text, appropriate contrast ratios (WCAG AA minimum 4.5:1), and clearly visible interactive elements
2. **Given** the dark theme is active, **When** users interact with data tables, cards, and forms, **Then** all content maintains visual hierarchy, borders are discernible, and hover states are clearly indicated
3. **Given** the dark theme displays role-based colors (Don, Mafia, Sheriff, Citizen), **When** users view player statistics and game details, **Then** role colors are adjusted for dark backgrounds while maintaining brand consistency and accessibility
4. **Given** users switch between light and dark themes, **When** the transition occurs, **Then** it happens smoothly without flickering, and all components render correctly in the new theme

---

### Edge Cases

- **EC-001**: When an administrator attempts to stop an import that is in a commit phase, the system MUST allow cancellation but clearly warn that the current batch (100 records) will complete before termination
- **EC-002**: When clearing the database, the system MUST preserve all User accounts (admin and regular), all sync/import audit tables, and system configuration to prevent complete lockout, while removing all imported game data including Player, Club, Game, Tournament, and related statistics
- **EC-003**: When an import is stopped mid-operation, the system MUST release all locks (advisory locks, database locks), update sync status appropriately, and ensure no orphaned transactions remain
- **EC-004**: When dark theme is enabled on pages with data visualizations (charts, graphs), the system MUST ensure chart elements (axes, legends, data points) have sufficient contrast and visibility
- **EC-005**: When clearing the database fails partway through (e.g., due to foreign key constraints or active connections), the system MUST rollback all changes, maintain data integrity, and report specific errors to administrators
- **EC-006**: When administrators clear the database while users are actively viewing data, the system MUST handle graceful degradation by showing appropriate empty states and preventing errors on affected pages
- **EC-007**: When switching themes, the system MUST preserve user scroll position and form inputs to prevent data loss or disorientation
- **EC-008**: When an import is cancelled due to timeout after clearing the database, the system MUST provide administrators with a clear path to restart the import from the beginning

## Requirements _(mandatory)_

### Functional Requirements

#### Admin Dashboard

- **FR-001**: System MUST provide a centralized admin dashboard accessible at `/admin` route, restricted to users with ADMIN role
- **FR-002**: System MUST display system health metrics including database connection status, current import progress, last sync completion time, and error counts in the last 24 hours
- **FR-003**: System MUST show recent activity summaries including new users, import operations, sync events, and system alerts in chronological order
- **FR-004**: System MUST provide quick action cards or buttons for common administrative tasks: User Management, Import Controls, Settings, View Logs
- **FR-005**: System MUST update dashboard metrics in real-time or near-real-time (within 5 seconds) when data changes occur
- **FR-006**: System MUST display visual status indicators (badges, icons, colors) for system health with clear meanings: healthy (green), degraded (yellow), critical (red)
- **FR-007**: System MUST show data volume metrics including total players, games, tournaments, and clubs in the database with last updated timestamps

#### Import Cancellation

- **FR-008**: System MUST provide a "Stop Import" button on the admin dashboard and import controls page that is visible when an import is running
- **FR-009**: System MUST display a confirmation dialog when administrators click "Stop Import" with clear information about the consequences
- **FR-010**: System MUST immediately terminate import operations when cancellation is confirmed, releasing all advisory locks and database connections
- **FR-011**: System MUST update sync status to "CANCELLED" with timestamp and administrator information when import is stopped
- **FR-012**: System MUST gracefully handle import cancellation by ensuring current batch commits are completed and checkpoints are saved before termination
- **FR-013**: System MUST allow cancelled imports to be resumed from the last checkpoint without creating duplicate records
- **FR-014**: System MUST disable or hide the "Stop Import" button when no import is currently running

#### Database Clear for Fresh Import

- **FR-015**: System MUST provide a "Clear Database" button in the admin import controls page, restricted to ADMIN role with additional confirmation
- **FR-016**: System MUST display a strong warning dialog requiring explicit confirmation before database clearing, explaining that all imported game data will be permanently deleted while user accounts and system configuration are preserved
- **FR-017**: System MUST prevent database clearing while any import operation is in progress, displaying an error message directing administrators to stop imports first
- **FR-018**: System MUST remove all imported game data including: Player, Club, Game, Tournament, GameParticipation, PlayerRoleStats, PlayerYearStats, PlayerTournament, and Analytics tables when clearing the database
- **FR-019**: System MUST preserve all User accounts (both regular and admin since they share the same table), all sync/import audit tables (SyncLog, SyncStatus, ImportCheckpoint, ImportProgress), Region reference data, system operation logs (Notification, DataIntegrityReport, EmailLog), and authentication configuration when clearing the database
- **FR-020**: System MUST log database clear operations with administrator information, timestamp, and reason in audit logs
- **FR-021**: System MUST provide confirmation feedback after successful database clearing with option to immediately start a fresh import
- **FR-022**: System MUST handle database clearing failures gracefully with transaction rollback and detailed error reporting

#### Dark Theme Enhancement

- **FR-023**: System MUST apply modern dark theme best practices including appropriate contrast ratios (minimum WCAG AA 4.5:1 for normal text, 3:1 for large text)
- **FR-024**: System MUST ensure all text is readable in dark mode with sufficient contrast between foreground and background colors
- **FR-025**: System MUST adjust interactive elements (buttons, inputs, links, cards) for dark mode with clear hover states and focus indicators
- **FR-026**: System MUST adapt data tables for dark mode with visible borders, alternating row colors, and readable cell content
- **FR-027**: System MUST ensure role-based colors (Don purple, Mafia black, Sheriff yellow, Citizen brown) display appropriately in dark mode while maintaining brand identity and accessibility
- **FR-028**: System MUST apply dark theme consistently across all pages including admin dashboard, user pages, authentication pages, and error pages
- **FR-029**: System MUST ensure charts and data visualizations render correctly in dark mode with visible axes, legends, and data points
- **FR-030**: System MUST provide smooth theme transitions without flickering when switching between light and dark modes
- **FR-031**: System MUST test all UI components in dark mode including dropdowns, modals, tooltips, notifications, and navigation menus
- **FR-032**: System MUST maintain consistent color palette in dark mode using semantic color tokens (background, foreground, primary, secondary, accent, muted, destructive, border)

### Key Entities _(include if feature involves data)_

- **AdminDashboard**: Centralized interface displaying system metrics, recent activity, alerts, and quick actions for administrators
- **ImportControl**: Administrative interface for managing import operations including start, stop, and clear database functions
- **SystemHealth**: Real-time status indicators for database connectivity, import status, sync status, and error rates
- **ImportOperation**: Current state of data import including progress percentage, current phase, status (RUNNING, COMPLETED, FAILED, CANCELLED), and checkpoint information
- **DatabaseClear**: Administrative operation to reset imported game data while preserving all User accounts, sync/import audit tables, system operation logs, and authentication configuration
- **DarkTheme**: Enhanced theme configuration with improved contrast ratios, color adjustments, and professional styling for low-light usage
- **AdminAuditLog**: Records of administrative actions including import cancellations, database clears, with timestamps, administrator identity, and operation results

## Success Criteria _(mandatory)_

### Measurable Outcomes

#### Admin Dashboard

- **SC-001**: Administrators can access the admin dashboard and view all system metrics within 3 seconds of page load
- **SC-002**: Dashboard displays current import progress, last sync time, and system health status with 100% accuracy
- **SC-003**: Quick action buttons navigate to intended pages with 100% success rate
- **SC-004**: Dashboard updates reflect import progress changes within 5 seconds of backend updates

#### Import Cancellation

- **SC-005**: Administrators can stop a running import operation within 10 seconds of clicking the stop button
- **SC-006**: Cancelled imports release all locks and update status correctly 100% of the time
- **SC-007**: Zero data corruption occurs from import cancellation when using proper checkpoint handling
- **SC-008**: Cancelled imports resume from the last checkpoint without creating duplicate records 100% of the time

#### Database Clear

- **SC-009**: Database clearing operation completes successfully without errors in under 2 minutes for typical database sizes
- **SC-010**: All imported game data is removed while preserving all User accounts, audit tables, and system configuration 100% of the time
- **SC-011**: Administrators can start fresh import immediately after database clearing without errors
- **SC-012**: Zero instances of administrator lockout occur due to preserved authentication configuration

#### Dark Theme

- **SC-013**: 100% of pages pass WCAG AA contrast ratio requirements in dark mode (minimum 4.5:1 for normal text, 3:1 for large text)
- **SC-014**: Administrators rate dark theme visual quality as "Good" or "Excellent" (4+ on 5-point scale) in user testing
- **SC-015**: All interactive elements (buttons, links, inputs) are clearly visible and indicate hover/focus states in dark mode
- **SC-016**: Role-based colors maintain brand consistency and accessibility standards in dark mode
- **SC-017**: Theme switching completes smoothly without visual glitches in under 500ms transition time
- **SC-018**: 95% of users successfully identify and use all features in dark mode without assistance

## Assumptions

- Administrator role and authentication are already implemented and functional
- Import infrastructure from feature 003-gomafia-data-import is operational with checkpoint support
- Advisory locks and database connection management are properly implemented
- The current dark theme implementation uses Tailwind CSS with CSS custom properties
- ShadCN/UI components are in use and can be customized for dark theme
- Database supports transactions with proper rollback capabilities
- Audit logging infrastructure exists for tracking administrative actions
- Users have modern web browsers that support CSS custom properties and prefers-color-scheme media query

## Dependencies

- Feature 003-gomafia-data-import MUST be implemented with checkpoint support and advisory locks
- Feature 005-auth-ux MUST be implemented with role-based access control (ADMIN role)
- Feature 009-first-release-prep MUST have established admin bootstrap and admin panel
- ShadCN/UI component library MUST be available for consistent styling
- Tailwind CSS MUST be configured with dark mode support
- Database MUST support advisory locks (PostgreSQL pg_try_advisory_lock)
- Import orchestrator MUST support graceful cancellation through AbortSignal
- Frontend state management MUST support real-time or near-real-time updates (polling, WebSocket, or Server-Sent Events)
