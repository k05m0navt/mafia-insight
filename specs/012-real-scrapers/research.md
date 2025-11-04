# Research Findings: Replace Mock Scrapers with Real Scrapers

**Date**: January 27, 2025  
**Feature**: Replace Mock Scrapers with Real Scrapers  
**Purpose**: Resolve technical unknowns and establish integration patterns for admin imports

## Strategy to Phase Mapping

**Decision**: Map admin strategy IDs to corresponding Phase classes and scrapers.

**Rationale**:

- Admin dashboard strategies align with ImportOrchestrator phases
- Phases encapsulate scraping, validation, and persistence
- Strategy-to-phase mapping enables one-off imports

**Mapping**:

- `players` → `PlayersPhase` → `PlayersScraper`
- `clubs` → `ClubsPhase` → `ClubsScraper`
- `tournaments` → `TournamentsPhase` → `TournamentsScraper`
- `games` → `GamesPhase` → `TournamentGamesScraper`
- `player_stats` → `PlayerYearStatsPhase` → `PlayerStatsScraper`
- `tournament_results` → `PlayerTournamentPhase` → `PlayerTournamentHistoryScraper`

**Alternatives considered**:

- Create new scraping layer: Rejected due to duplication
- Extend DataImportStrategy with scrapers: Rejected due to mixing patterns
- Use only 7-phase runs: Rejected because admins need per-strategy imports

## Progress Tracking Architecture

**Decision**: Keep `ImportOrchestrator` (singleton) for admin progress and `ImportOrchestrator` (7-phase) for orchestration.

**Rationale**:

- `ImportOrchestrator` (singleton): tracks import progress in `ImportProgress`
- `ImportOrchestrator` (7-phase): provides phases, rate limiting, checkpoints, validation
- Admin endpoints use the singleton and create a 7-phase for single-phase runs

**Implementation Strategy**:

- Launch a browser
- Create an `ImportOrchestrator` (7-phase) with the browser
- Instantiate the selected phase
- Run the phase and update progress via the singleton
- Clean up the browser

**Alternatives considered**:

- Merge the orchestrators: Rejected due to misaligned concerns
- Track progress in the Phase: Rejected because phases don’t own UI

## Advisory Lock Integration

**Decision**: Use `AdvisoryLockManager` from `ImportOrchestrator` to prevent concurrent imports.

**Rationale**:

- Ensures one active import
- Avoids data corruption
- Same pattern as `/api/gomafia-sync/import`

**Implementation Strategy**:

- Acquire the lock before running a phase
- Release on success/failure
- Reject if another import is in progress
- Timeout after 12 hours if needed

**Alternatives considered**:

- No locks: Rejected due to race conditions
- App-level locks: Rejected due to distributed complexity

## Progress Update Integration

**Decision**: Update `ImportOrchestrator` (singleton) during phase execution.

**Rationale**:

- Phases provide final counts
- Update via the singleton for admin UI
- Consider granular per-batch updates later

**Implementation Strategy**:

- Start import in the singleton
- Run the phase
- Read metrics from the phase
- Update progress via the singleton
- Complete/fail in the singleton

**Alternatives considered**:

- Phases update progress directly: Rejected due to tight coupling
- Separate progress service: Rejected as unnecessary

## Error Handling and Retries

**Decision**: Rely on Phase retries with `ImportOrchestrator` infrastructure.

**Rationale**:

- Phases already handle retries
- Rate limiter + checkpoints provide resilience
- No need to duplicate

**Implementation Strategy**:

- No custom retry logic in the admin endpoint
- Phases manage retries
- Log aggregated errors for admin UI
- Write detailed errors to the database

## Progress Display Strategy

**Decision**: Admin dashboard remains unchanged; progress updates via `/api/import/progress`.

**Rationale**:

- Existing UI is fine
- Progress originates from `ImportOrchestrator` (singleton) and `ImportProgress`
- Polling every 2–5s

**Implementation Strategy**:

- No UI changes
- Progress flows through `/api/import/progress`
- Updates appear in the admin dashboard
- Track phase name, progress, record counts, validation rate

## Browser Lifecycle Management

**Decision**: Launch browser per import and reuse across phases.

**Rationale**:

- Launched on demand to reduce overhead
- Shared context across phases
- Clean shutdown

**Implementation Strategy**:

- `chromium.launch({ headless: true })`
- Pass browser to `ImportOrchestrator`
- Reuse across phases
- Close in `finally`

**Alternatives considered**:

- Global browser: Rejected due to interference
- Per-phase browsers: Rejected as wasteful

## Checkpoint and Resume Strategy

**Decision**: Use checkpoints from `ImportOrchestrator` infrastructure.

**Rationale**:

- CheckpointManager supports resuming failed imports
- Stored in `ImportCheckpoint`
- Phases save checkpoints

**Implementation Strategy**:

- Automatically on admin import start
- Resume from the last checkpoint if available
- Checkpoints persist across restarts

**Alternatives considered**:

- Custom checkpointing: Rejected as unnecessary
- Disabling checkpoints: Rejected due to reliability needs

## Validation Metrics Display

**Decision**: Expose metrics via the admin dashboard.

**Rationale**:

- SC-002 requires ≥95% validation
- Admin visibility into health and issues
- Drive reliability

**Metrics to Display**:

- Total fetched
- Valid records
- Invalid records (with logs)
- Duplicates skipped
- Validation rate (%)

**Implementation Strategy**:

- `ImportOrchestrator` tracks per import
- Logs include context
- Metrics in the admin dashboard
- Detailed logs on demand

## Mock Data Removal

**Decision**: Remove `generateSampleData` and related interfaces.

**Rationale**:

- FR-002; SC-001: zero mock data
- Clean up mock types
- Favor real scrapers

**Implementation Strategy**:

- Delete `generateSampleData`
- Remove sample interfaces
- Run real Phase executions
- Update tests to use real data
- Keep `DataImportStrategy` for now; consider later consolidation
