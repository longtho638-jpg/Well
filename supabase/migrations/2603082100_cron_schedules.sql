-- ============================================================
-- Phase 7: PostgreSQL Cron Job Schedules
-- Description: Schedule automated tasks for overage billing and dunning
-- Created: 2026-03-08
-- ============================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- Cron Job 1: Sync Overages to Stripe
-- Runs daily at 2 AM UTC to sync pending overage transactions
-- ============================================================
SELECT cron.schedule(
  'sync-overages-to-stripe',
  '0 2 * * *',  -- Daily at 2 AM UTC
  $$
    SELECT supabase_functions.invoke('sync-overages-cron')
  $$
);

-- ============================================================
-- Cron Job 2: Process Unpaid Invoices
-- Runs daily at 9 AM UTC to detect unpaid invoices
-- ============================================================
SELECT cron.schedule(
  'process-unpaid-invoices',
  '0 9 * * *',  -- Daily at 9 AM UTC
  $$
    SELECT supabase_functions.invoke('process-unpaid-invoices')
  $$
);

-- ============================================================
-- Cron Job 3: Process Dunning Stages
-- Runs every 6 hours to advance dunning stages
-- ============================================================
SELECT cron.schedule(
  'process-dunning-stages',
  '0 */6 * * *',  -- Every 6 hours
  $$
    SELECT process_dunning_stages()
  $$
);

-- ============================================================
-- Cron Job 4: Retry Failed Stripe Syncs
-- Runs every 12 hours to retry failed syncs
-- ============================================================
SELECT cron.schedule(
  'retry-failed-stripe-syncs',
  '0 */12 * * *',  -- Every 12 hours
  $$
    -- Update retry count and next_retry_at for failed syncs
    UPDATE stripe_usage_sync_log
    SET retry_count = retry_count + 1,
        next_retry_at = NOW() + INTERVAL '1 hour' * POWER(2, retry_count)
    WHERE sync_status = 'failed'
      AND retry_count < 5
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
  $$
);

-- ============================================================
-- Cron Job 5: Auto-suspend Past Due Subscriptions
-- Runs daily at 3 AM UTC to suspend subscriptions past due > 14 days
-- ============================================================
SELECT cron.schedule(
  'auto-suspend-past-due',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
    -- Update subscriptions past due for more than 14 days
    UPDATE user_subscriptions
    SET status = 'suspended',
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{suspended_at}',
          to_jsonb(NOW())
        )
    WHERE status = 'past_due'
      AND NOW() > created_at + INTERVAL '14 days'
      AND stripe_subscription_id IS NOT NULL
  $$
);

-- ============================================================
-- View Scheduled Jobs
-- ============================================================
-- SELECT * FROM cron.job;

-- ============================================================
-- View Job Run Logs
-- ============================================================
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 100;

-- ============================================================
-- Unscheduling Jobs (if needed)
-- ============================================================
-- SELECT cron.unschedule('sync-overages-to-stripe');
-- SELECT cron.unschedule('process-unpaid-invoices');
-- SELECT cron.unschedule('process-dunning-stages');
-- SELECT cron.unschedule('retry-failed-stripe-syncs');
-- SELECT cron.unschedule('auto-suspend-past-due');

-- ============================================================
-- End of Migration
-- ============================================================
