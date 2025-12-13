# Migration Ordering Fix

## Problem
Migrations with timestamps from January 2025 (`20250126_*`, `20250127_*`) were trying to run before the October 2025 init migration (`20251025190350_init`), causing errors like:
- `The underlying table for model tournaments does not exist`
- `column "presidentId" does not exist`
- `column "gomafiaId" does not exist`

## Solution

### 1. Renamed Migrations for Correct Chronological Order
All migrations were renamed to have timestamps that come after the init migration:

- `20250126_add_tournament_game_count` → `20251025190351_add_tournament_game_count`
- `20250126_add_validation_metrics_to_sync_status` → `20251025234408_add_validation_metrics_to_sync_status`
- `20250127_add_security_events` → `20251026000001_add_security_events`
- `20250127120000_add_game_fields...` → `20251026000002_add_game_fields...`
- `20250127140000_add_foreign_key_indexes` → `20251026000003_add_foreign_key_indexes`
- `20250127140001_remove_unused_indexes` → `20251026000004_remove_unused_indexes`
- `20250127140002_optimize_rls_policies` → `20251026000005_optimize_rls_policies`
- `20250127150000_add_password_reset_tokens` → `20251026000006_add_password_reset_tokens`

### 2. Made Migrations Defensive

#### `20251026000000_add_import_indexes`
- Added column existence checks before creating indexes
- Uses PostgreSQL `DO $$` blocks with conditional logic
- Prevents errors when columns don't exist yet

#### `20251026000003_add_foreign_key_indexes`
- Added column existence checks before creating indexes
- Checks for `presidentId` and other columns before indexing
- Prevents errors when columns are added in later migrations

#### `20251026000005_optimize_rls_policies`
- Added Supabase `auth` schema existence check
- Uses PostgreSQL `DO $$` block to conditionally create RLS policies
- Skips policy creation if `auth` schema doesn't exist (e.g., in shadow database)
- Prevents errors when Supabase auth is not available

## Current Migration Order

```
20251025190350_init
20251025190351_add_tournament_game_count
20251025234407_add_sync_tables
20251025234408_add_validation_metrics_to_sync_status
20251026000000_add_import_indexes (defensive)
20251026000001_add_security_events
20251026000002_add_game_fields_table_number_judge_elo_first_shoot
20251026000003_add_foreign_key_indexes (defensive)
20251026000004_remove_unused_indexes
20251026000005_optimize_rls_policies
20251026000006_add_password_reset_tokens
20251103165316_add_first_shoot_type
20251203065822_add_oauth_account_model
```

## Usage

You can now run `yarn prisma migrate dev` without migration ordering errors. The migrations will:
1. Apply in the correct chronological order
2. Handle missing columns gracefully with defensive checks
3. Work correctly with Prisma's shadow database validation

## Notes

- If you need to add new migrations, ensure they have timestamps that come after the latest migration
- When creating indexes on columns that might not exist, use defensive checks like the examples above
- The `DROP INDEX IF EXISTS` and `DROP POLICY IF EXISTS` statements are already defensive
