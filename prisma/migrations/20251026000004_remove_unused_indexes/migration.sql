-- Remove unused indexes identified by Supabase performance advisors
-- These indexes have never been used and can be safely removed

-- Remove unused index from notifications table
DROP INDEX IF EXISTS notifications_createdAt_idx;

-- Remove unused indexes from email_logs table
DROP INDEX IF EXISTS email_logs_status_createdAt_idx;
DROP INDEX IF EXISTS email_logs_type_idx;

-- Remove unused indexes from data_integrity_reports table
DROP INDEX IF EXISTS data_integrity_reports_timestamp_idx;
DROP INDEX IF EXISTS data_integrity_reports_status_idx;

