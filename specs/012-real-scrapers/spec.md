# Feature Specification: Replace Mock Scrapers with Real Scrapers

**Feature Branch**: `012-real-scrapers`  
**Created**: January 27, 2025  
**Status**: Draft  
**Input**: User description: "Right now, the app use mock scrapers, there is need to remoe them and use real scrapers:"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin Manual Import Uses Real Scrapers (Priority: P1)

When an admin manually triggers an import operation from the admin dashboard, the system fetches data from gomafia.pro using the real Playwright-based scrapers instead of generating mock/sample data. The import progresses through all 7 phases (Clubs, Players, Player Year Stats, Tournaments, Player Tournament History, Games, Statistics) using actual scraped data from the live website.

**Why this priority**: This is the core functionality - admin imports should use real data sources, not test data. Without this, the admin dashboard is useless for real operations.

**Independent Test**: Navigate to `/admin/import`, click "Start Import" for Players strategy, verify in database that imported players have valid gomafiaId values and real names from gomafia.pro (not "Player 1", "Player 2" etc.)

**Acceptance Scenarios**:

1. **Given** an empty database and a running application, **When** an admin clicks "Start Import" for Players strategy, **Then** the system scrapes players from gomafia.pro/rating using PlayersScraper and imports real player data
2. **Given** an empty database, **When** an admin starts a Clubs import, **Then** the system uses ClubsScraper to fetch real club data from gomafia.pro/rating?tab=clubs
3. **Given** a running import, **When** the import completes, **Then** all records have valid gomafia IDs and data matches what's visible on gomafia.pro

---

### Edge Cases

- What happens when gomafia.pro is temporarily unavailable? → System should retry with exponential backoff and fail gracefully
- How does system handle rate limiting from gomafia.pro? → Rate limiter enforces 2-second delay between requests
- What happens when scraped data format changes on gomafia.pro? → Validation errors logged, invalid records skipped with metrics tracked
- How does system handle partial import failure? → Checkpoint system allows resuming from last successful batch
- What if admin starts import while another is running? → Advisory lock prevents concurrent imports, returns appropriate error

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST use real scraper implementations (PlayersScraper, ClubsScraper, TournamentsScraper, etc.) when admin triggers imports from `/admin/import`
- **FR-002**: System MUST remove mock data generation functions (generateSampleData) from admin import endpoint
- **FR-003**: System MUST integrate ImportOrchestrator with 7-phase scraping workflow into admin import flow
- **FR-004**: System MUST display accurate progress metrics (players scraped, clubs scraped, etc.) during admin imports
- **FR-005**: System MUST handle scraper errors gracefully with retry logic and proper error reporting
- **FR-006**: System MUST enforce rate limiting (2 seconds between requests) during admin imports
- **FR-007**: System MUST validate all scraped data before inserting into database
- **FR-008**: System MUST track validation metrics (valid records, invalid records, duplicates skipped)
- **FR-009**: System MUST support resuming failed imports from last checkpoint

### Key Entities

- **ImportOrchestrator**: Coordinates 7-phase import workflow with real scrapers, manages checkpoints, validation, and progress tracking
- **Scrapers**: PlayersScraper, ClubsScraper, TournamentsScraper, TournamentGamesScraper, PlayerStatsScraper, PlayerTournamentHistoryScraper - fetch data from gomafia.pro using Playwright
- **Import Checkpoint**: Tracks progress through import phases, allows resuming from failures
- **Validation Metrics**: Tracks valid vs invalid records, duplicates, and validation rate during import

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of admin-initiated imports use real scrapers from gomafia.pro, with zero mock data generation
- **SC-002**: Import operations complete successfully with ≥95% data validation rate (valid records / total scraped)
- **SC-003**: System processes full player/club/tournament imports in ≤30 minutes for typical dataset sizes
- **SC-004**: Admin dashboard shows accurate real-time progress with phase names and record counts during imports
- **SC-005**: Failed imports can resume from checkpoint with ≤5% duplicate records created
- **SC-006**: All imported players have valid gomafiaId values that match records on gomafia.pro website

## Assumptions

- Real scraper implementations already exist in `src/lib/gomafia/scrapers/` and are fully tested and functional
- ImportOrchestrator (from feature 003-gomafia-data-import) is operational and can handle 7-phase import workflow
- The admin import page at `/admin/import` currently uses `/api/admin/import/start` which generates mock data
- `/api/gomafia-sync/import` already uses real scrapers and can be used as reference for integration
- Mock data generation functions (generateSampleData) can be safely removed without breaking other parts of the system
- Playwright browser automation is configured and functional for scraping gomafia.pro
- gomafia.pro maintains consistent HTML structure during the migration period
- Database schema and infrastructure can handle real data volume from gomafia.pro

## Dependencies

- Feature 003-gomafia-data-import MUST be fully implemented with working ImportOrchestrator and real scrapers
- Real scrapers (PlayersScraper, ClubsScraper, TournamentsScraper, etc.) MUST exist in `src/lib/gomafia/scrapers/`
- ImportOrchestrator MUST be accessible and functional for 7-phase workflow
- Admin dashboard infrastructure MUST exist at `/admin/import` with UI components for import management
- Database connection and Prisma client MUST be operational
- Next.js application MUST be deployed or running locally to execute import operations
