# Feature Specification: GoMafia Initial Data Import

**Feature Branch**: `003-gomafia-data-import`  
**Created**: October 25, 2025  
**Status**: Draft  
**Input**: User description: "As the user, I do not see any data displayed in the app, because DB is empty. There is need to parse the gomafia and fill in the DB with real data"

**Terminology Note**: This feature uses "initial import" to refer to the one-time population of an empty database with all historical data from gomafia.pro. This is distinct from "sync" operations (feature 002-gomafia-data-sync) which handle ongoing incremental updates. The initial import leverages the existing sync infrastructure but represents a different use case focused on first-time data population.

## Clarifications

### Session 2025-10-25

- Q: What is the scope of historical data to import from gomafia.pro? → A: All historical data from gomafia.pro
- Q: What checkpoint strategy should the system use when resuming a failed import? → A: Resume from last completed batch
- Q: What rate limit should be applied when scraping gomafia.pro during import? → A: 1 request every 2 seconds (30 requests/minute)
- Q: How should re-import handle existing data in the database? → A: Skip existing records based on gomafiaId, only import new ones
- Q: What order should games be imported in for optimal user experience? → A: Import newest games first (descending chronological order)

### Session 2025-10-26: Detailed Data Sources

The following detailed scraping requirements were provided based on gomafia.pro structure analysis:

**Player Data Sources**:

1. **Player Stats by Year** ([gomafia.pro/stats/{id}](https://gomafia.pro/stats/575))
   - Year selector (2025, 2024, etc.) - requires waiting for data load after year change
   - Extract: Games by role (Мирный/Civilian, Шериф/Sheriff, Мафия/Mafia, Дон/Don)
   - Extract: Total games, ELO rating (without rounding), Extra points (дополнительные баллы)

2. **Player Tournament History** ([gomafia.pro/stats/{id}?tab=history](https://gomafia.pro/stats/575?tab=history))
   - Paginated list of tournaments player participated in
   - Extract: Tournament name, dates, placement, GG points, ELO change, prize money (Призовые)
   - Pagination: Bottom buttons or `?tab=history&page=2` parameter

3. **Players List** ([gomafia.pro/rating](https://gomafia.pro/rating))
   - Year filter (2025, All, etc.) - button or `?yearUsers=2025` parameter
   - Region filter (All regions, specific regions) - button or `?regionUsers=all` parameter
   - Extract: Player name, club, tournaments played, GG points, ELO, **region**
   - Pagination: Bottom buttons or `?yearUsers=2025&regionUsers=all&pageUsers=2`

**Club Data Sources**: 4. **Clubs List** ([gomafia.pro/rating?tab=clubs](https://gomafia.pro/rating?tab=clubs))

- Year filter - button or `?tab=clubs&yearClubs=2025` parameter
- Region filter - button or `?tab=clubs&regionClubs=all` parameter
- Extract: Club name, **region**, statistics
- Pagination: Bottom buttons or `?pageClubs=2` parameter

5. **Club Details** ([gomafia.pro/club/{id}](https://gomafia.pro/club/196))
   - Extract: Club **president** (руководитель), club members list
   - Members pagination: Bottom buttons or `?page=2` parameter

**Tournament Data Sources**: 6. **Tournaments List** ([gomafia.pro/tournaments](https://gomafia.pro/tournaments))

- Time filter: Recent 30 days, All - button or `?time=30_days` parameter
- Type filter: `?type=all` parameter
- FSM rating filter: `?fsm=yes` parameter
- Extract: Tournament name, **stars count**, **average ELO**, dates, **status**

7. **Tournament Players** ([gomafia.pro/tournament/{id}?tab=tournament](https://gomafia.pro/tournament/1898?tab=tournament))
   - Extract: All players who participated in the tournament

8. **Tournament Games** ([gomafia.pro/tournament/{id}?tab=games](https://gomafia.pro/tournament/1898?tab=games))
   - Extract: All games played in the tournament with full game details

**Key Technical Notes**:

- Year selectors require waiting for dynamic content to load after selection
- All lists support both button-based navigation and URL parameter control
- Region information must be stored for both players and clubs
- Prize money (Призовые) must be captured from tournament history in rubles (₽)

### Session 2025-10-26: Clarifications

- Q: When should the auto-trigger for initial import execute when the database is empty? → A: On first API call requiring data (e.g., when user visits /players or /games page)
- Q: What mechanism should prevent concurrent import operations when multiple users trigger simultaneously? → A: Database-level advisory lock (PostgreSQL pg_try_advisory_lock)
- Q: What should happen if gomafia.pro's HTML structure changes mid-import, causing parser failures? → A: Log error, mark batch as failed, continue with remaining batches (best effort)
- Q: What is the maximum import duration before the operation should timeout? → A: 12 hours (fail if not complete, mark as timeout error)
- Q: How should the system handle incomplete/missing year data when iterating through player year stats? → A: Stop iterating years when 2 consecutive years return no data

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Initial Data Population (Priority: P1)

As a new user opening the application for the first time, I want to see real player and game data from gomafia.pro immediately, so that I can start analyzing and exploring mafia game statistics without waiting for scheduled syncs.

**Why this priority**: This is the foundational user experience issue - an empty application provides no value. Without initial data, users cannot experience any features, making this the highest priority for user retention and satisfaction.

**Independent Test**: Can be fully tested by running the initial import script, verifying the database contains real gomafia.pro data, and confirming the web interface displays this data to users immediately upon page load.

**Acceptance Scenarios**:

1. **Given** the database is empty, **When** the initial import runs, **Then** the database is populated with all historical players and games from gomafia.pro (minimum 100 players and 500 games)
2. **Given** the initial import completes successfully, **When** a user visits the players page, **Then** they see a populated list of real players with statistics
3. **Given** the initial import completes successfully, **When** a user visits the games page, **Then** they see a populated list of real games with details
4. **Given** the database already contains data, **When** the initial import is triggered, **Then** the system skips existing records based on gomafiaId and only imports new records from gomafia.pro

---

### User Story 2 - Import Progress Visibility (Priority: P2)

As a user or administrator, I want to see real-time progress of the data import operation, so that I understand how long it will take and can verify it's working correctly.

**Why this priority**: Import operations can take several minutes for large datasets. Users need visibility into progress to avoid thinking the system is frozen or broken.

**Independent Test**: Can be fully tested by triggering an import and observing the progress indicator updates in real-time, showing percentage completion and current operation status.

**Acceptance Scenarios**:

1. **Given** an import operation is in progress, **When** a user views the sync status page, **Then** they see progress percentage, current operation (e.g., "Importing players: 50/200"), and estimated time remaining
2. **Given** the import is parsing player data, **When** progress updates, **Then** the UI shows "Importing player: [Player Name]" and increments the progress bar
3. **Given** the import transitions from players to games, **When** the operation changes, **Then** the UI updates to show "Now importing games..." with a new progress indicator

---

### User Story 3 - Import Error Recovery (Priority: P3)

As a user, I want the system to handle import failures gracefully and provide clear error messages, so that I can understand what went wrong and retry the operation if needed.

**Why this priority**: While important for reliability, error handling is secondary to core functionality. Most imports should succeed, making this a lower priority than getting the happy path working.

**Independent Test**: Can be fully tested by simulating network failures or invalid data during import, verifying appropriate error messages are displayed, and confirming the system allows retry without data corruption.

**Acceptance Scenarios**:

1. **Given** the import encounters a network error, **When** the error occurs, **Then** the system logs the error, displays a user-friendly message ("Network issue - retrying..."), and automatically retries up to 3 times
2. **Given** the import fails after all retries, **When** the operation completes, **Then** the user sees a clear error message explaining what happened and a "Retry Import" button
3. **Given** the import is interrupted mid-operation, **When** the user retries, **Then** the system resumes from the last completed batch (100 records) without creating duplicate records

---

### User Story 4 - Import Validation & Quality Assurance (Priority: P2)

As a user, I want to verify that imported data is complete and accurate, so that I can trust the statistics and analysis displayed in the application.

**Why this priority**: Data quality is crucial for user trust. Users need confidence that the imported data accurately reflects gomafia.pro information.

**Independent Test**: Can be fully tested by comparing a sample of imported records against gomafia.pro source data, verifying all required fields are populated, and confirming relationships between players and games are correct.

**Acceptance Scenarios**:

1. **Given** the import completes, **When** viewing import summary, **Then** users see total records imported, validation errors (if any), and data quality metrics (e.g., "98% of records complete")
2. **Given** imported player data, **When** checking data integrity, **Then** all players have valid gomafiaId, name, and at least basic statistics
3. **Given** imported game data, **When** checking relationships, **Then** all game participations correctly link to existing players with valid roles and teams

---

### Edge Cases

- **EC-001**: When gomafia.pro is unavailable during initial import, the system MUST display a clear error message, wait 5 minutes, and automatically retry up to 3 times before requiring manual intervention. (Note: This 5-minute wait applies when gomafia.pro is completely unavailable. For intermittent connectivity issues, see EC-006 exponential backoff strategy)
- **EC-002**: When the database already contains partial data from a previous failed import, the system MUST detect duplicate records based on gomafiaId and skip them to prevent constraint violations
- **EC-003**: When importing very large datasets (10,000+ records), the system MUST process in batches of 100 records to prevent memory exhaustion and provide granular progress updates
- **EC-004**: When parsing fails for individual records (malformed HTML), the system MUST log the error, skip that record, and continue importing remaining records to maximize data availability
- **EC-005**: When the import is manually cancelled by a user, the system MUST cleanly stop processing, commit already-imported data, and mark the import as "CANCELLED" in sync logs
- **EC-006**: When network connectivity is intermittent, the system MUST implement retry logic with exponential backoff (1s, 2s, 4s delays) before marking the import as failed
- **EC-007**: When gomafia.pro's HTML structure changes mid-import causing systematic parser failures for a specific entity type (e.g., all clubs or all tournaments), the system MUST log the error with parser diagnostics, mark affected batches as failed in sync logs, and continue importing remaining entity types to maximize data availability in a best-effort manner
- **EC-008**: When the import operation exceeds the 12-hour maximum duration, the system MUST gracefully terminate the import, commit all successfully imported data up to that point, release the advisory lock, mark the operation as "FAILED" with timeout error in sync logs, and allow manual retry with resume capability from the last successful checkpoint
- **EC-009**: When scraping player year stats and encountering years with no data, the system MUST stop iterating through historical years when 2 consecutive years return no data (indicating the player's historical participation has ended), to avoid unnecessary API calls while handling single-year gaps in player participation

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an initial data import command/script that can be executed manually or automatically on first deployment
- **FR-002**: System MUST leverage the existing gomafia sync infrastructure (from feature 002) to perform the initial import
- **FR-003**: System MUST detect if the database is empty and automatically trigger the initial import on the first API call requiring data (e.g., when a user visits /players or /games page)
- **FR-004**: System MUST import all historical data from gomafia.pro including all players and all games (minimum 100 players and 500 games for meaningful analytics)
- **FR-005**: System MUST import games in descending chronological order (newest first) to provide users with recent relevant data as quickly as possible
- **FR-006**: System MUST display real-time progress during import showing percentage complete, current operation, and records processed
- **FR-007**: System MUST validate all imported data against the database schema before storage to prevent invalid data
- **FR-008**: System MUST skip duplicate records based on gomafiaId to prevent constraint violations during import
- **FR-009**: System MUST process imports in batches (100 records per batch) to optimize memory usage and database performance
- **FR-010**: System MUST respect rate limits when scraping gomafia.pro by enforcing a minimum delay of 2 seconds between requests (maximum 30 requests per minute)
- **FR-011**: System MUST checkpoint progress after each completed batch to enable resumption from the last successful batch in case of failure
- **FR-012**: System MUST log all import operations in the sync_logs table with detailed status and error information
- **FR-013**: System MUST provide an import summary upon completion showing total records imported, errors encountered, and data quality metrics
- **FR-014**: System MUST allow manual triggering of the initial import through a UI button in the sync management interface
- **FR-015**: System MUST prevent concurrent import operations using PostgreSQL advisory locks (pg_try_advisory_lock) in combination with sync_status.isRunning checks to ensure only one import runs at a time across all application instances
- **FR-016**: System MUST implement retry logic with exponential backoff for transient failures (network errors, timeouts)
- **FR-017**: System MUST create player role statistics automatically after importing player and game data
- **FR-018**: System MUST update the sync_status table throughout the import with current progress and operation details
- **FR-019**: Users MUST be able to view the application with populated data immediately after import completes without requiring page refresh
- **FR-020**: System MUST mark all successfully imported records with syncStatus as "SYNCED" and set lastSyncAt timestamp
- **FR-021**: System MUST provide a mechanism to re-run the initial import if needed, skipping existing records based on gomafiaId and only importing new records
- **FR-021a**: System MUST enforce a maximum import duration of 12 hours, after which the import operation MUST be marked as "FAILED" with a timeout error, commit any successfully imported data, and release all locks
- **FR-022**: System MUST scrape player data from `/rating` endpoint with year and region filters, extracting all players across all paginated pages
- **FR-023**: System MUST scrape detailed player stats from `/stats/{id}` endpoint for each year available, waiting for dynamic content to load after year selection, and MUST stop iterating through historical years when 2 consecutive years return no data
- **FR-024**: System MUST scrape player tournament history from `/stats/{id}?tab=history` including all tournaments, placements, and prize money won across all paginated pages
- **FR-025**: System MUST store region information for all players extracted from the players list
- **FR-026**: System MUST scrape clubs list from `/rating?tab=clubs` with year and region filters across all paginated pages
- **FR-027**: System MUST scrape club details from `/club/{id}` including president and all members across paginated member lists
- **FR-028**: System MUST store region information for all clubs extracted from the clubs list
- **FR-029**: System MUST scrape tournaments list from `/tournaments` with time, type, and FSM rating filters across all paginated pages
- **FR-030**: System MUST extract tournament metadata including stars count, average ELO, dates, and status
- **FR-031**: System MUST scrape tournament participants from `/tournament/{id}?tab=tournament` for each tournament
- **FR-032**: System MUST scrape tournament games from `/tournament/{id}?tab=games` for each tournament
- **FR-033**: System MUST store year-specific statistics per player (games by role, ELO, extra points) in PlayerYearStats table
- **FR-034**: System MUST store player-tournament relationships with placement, GG points, ELO change, and prize money in PlayerTournament table
- **FR-035**: System MUST extract prize money from tournament history in rubles (₽) and convert to appropriate decimal format

### Key Entities _(include if feature involves data)_

- **Player**: Individual mafia players with gomafiaId, name, elo rating, total games, wins, losses, **region**, club affiliation, and sync status
- **PlayerYearStats** _(new)_: Year-specific player statistics including games by role (DON, MAFIA, SHERIFF, CIVILIAN), total games, ELO rating, extra points per year
- **Club**: Mafia clubs with gomafiaId _(new)_, name, **region** _(new)_, **president** _(new)_, description, logo, and sync status _(new)_
- **Tournament**: Tournament records with gomafiaId _(new)_, name, **stars count** _(new)_, **average ELO** _(new)_, **FSM rating flag** _(new)_, dates, prize pool, and sync status _(new)_
- **PlayerTournament** _(new)_: Join table linking players to tournaments with placement, GG points earned, ELO change, **prize money won**
- **Game**: Individual game records with gomafiaId, date, duration, winner team, status, tournament association, and sync status
- **GameParticipation**: Links players to games with their assigned role, team, winner status, and performance score
- **SyncLog**: Records of import operations with type (FULL for initial import), status, start/end time, records processed, and errors
- **SyncStatus**: Current import operation state with running flag, progress percentage, current operation description, and last error
- **PlayerRoleStats**: Aggregated statistics per player per role (DON, MAFIA, SHERIFF, CITIZEN) showing games played, wins, losses, and win rates

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Initial import of all historical data completes within a reasonable timeframe accounting for rate limiting of 2 seconds per request (estimated: 1000 players and 5000 games within 3-4 hours), with a maximum duration limit of 12 hours before automatic timeout and failure
- **SC-002**: 98% of imported records pass validation and are stored successfully in the database
- **SC-003**: Users see populated data in the web interface within 5 seconds after import completion
- **SC-004**: Import progress updates refresh at least every 2 seconds to provide near-real-time feedback to users
- **SC-005**: The application detects empty database and automatically initiates import within 30 seconds of first deployment
- **SC-006**: 100% of imported players have valid gomafiaId and at least basic profile information (name, total games)
- **SC-007**: 100% of imported games have valid gomafiaId, date, and at least 2 player participations
- **SC-008**: Import operation successfully handles at least 3 retry attempts for transient network failures before marking as failed
- **SC-009**: Database contains no duplicate records (based on gomafiaId) after import completion
- **SC-010**: Users can manually trigger re-import with confirmation dialog within 2 clicks from the sync management page
- **SC-011**: Import resume from interrupted operation successfully continues from the last completed batch within 10 seconds of retry initiation
- **SC-012**: Users can view and interact with recent game data (last 30 days) within the first 10 minutes of import start due to newest-first import order

## Assumptions

- The sync infrastructure from feature 002-gomafia-data-sync is fully implemented and operational
- gomafia.pro maintains consistent HTML structure and data format during the import period
- The database schema supports all required fields for player and game data as defined in the Prisma schema
- Network connectivity to gomafia.pro is reliable with typical response times under 3 seconds per request
- The hosting environment has sufficient resources (memory, CPU) to handle batch processing of 100 records and complete historical data import
- Users understand that the initial import is a one-time operation that may take 30 minutes to several hours depending on historical data volume
- The application has appropriate error monitoring and logging capabilities to track import issues
- Database connection pool is configured to handle concurrent read/write operations during import
- Database storage capacity is sufficient for all historical data from gomafia.pro (potentially tens of thousands of games and thousands of players)

## Dependencies

- Feature 002-gomafia-data-sync MUST be fully implemented with working parser and sync infrastructure
- Prisma database schema MUST include all required models (Player, Game, GameParticipation, SyncLog, SyncStatus)
- Playwright browser automation MUST be configured and functional for scraping gomafia.pro
- Database MUST be accessible with valid DATABASE_URL and DIRECT_URL environment variables
- Next.js application MUST be deployed or running locally to execute import operations
- shadcn UI components MUST be available for displaying import progress and status
- The sync status API endpoints (/api/gomafia-sync/sync/status, /api/gomafia-sync/sync/trigger) MUST be operational
- Real-time or near-real-time UI updates MUST be possible (polling or WebSocket) to show progress
