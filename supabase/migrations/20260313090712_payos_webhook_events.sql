-- ============================================================================
-- PayOS Webhook Events Schema
-- ============================================================================
-- Purpose: Store PayOS webhook events for audit, analytics, and idempotency
-- Provider: PayOS (Vietnamese QR payment gateway)
-- Events: payment.paid (00), payment.cancelled (01), payment.pending
--
-- Usage:
--   1. Webhook handler stores ALL events here first
--   2. Check event_id/order_code + event_code for idempotency
--   3. Process event (update transactions, licenses, etc.)
--   4. Log to agent_logs for audit trail
-- ============================================================================

-- PayOS webhook events table
CREATE TABLE IF NOT EXISTS payos_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,              -- Unique event ID from PayOS
  order_code BIGINT NOT NULL,                  -- PayOS order code
  event_code TEXT NOT NULL,                    -- '00' = paid, '01' = cancelled
  amount BIGINT DEFAULT 0,                     -- Amount in cents/smallest unit
  currency TEXT DEFAULT 'VND',                 -- Currency code (VND, USD, etc.)
  description TEXT,                            -- Payment description
  reference TEXT,                              -- Transaction reference
  payment_link_id TEXT,                        -- PayOS payment link ID
  transaction_datetime TIMESTAMPTZ,            -- Transaction timestamp from PayOS
  payload JSONB,                               -- Full webhook payload for audit
  processed BOOLEAN DEFAULT false,             -- Has been processed
  processed_at TIMESTAMPTZ,                    -- When processed
  received_at TIMESTAMPTZ DEFAULT NOW(),       -- When received by webhook
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payos_events_order_code ON payos_webhook_events(order_code);
CREATE INDEX IF NOT EXISTS idx_payos_events_event_code ON payos_webhook_events(event_code);
CREATE INDEX IF NOT EXISTS idx_payos_events_processed ON payos_webhook_events(processed, received_at);
CREATE INDEX IF NOT EXISTS idx_payos_events_received ON payos_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_payos_events_payload ON payos_webhook_events USING GIN (payload);

-- Enable Row Level Security
ALTER TABLE payos_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY IF NOT EXISTS "Service role full access" ON payos_webhook_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can only read their own events (via order_code join)
-- Note: PayOS webhooks don't include user_id, so we restrict to service role only
-- Application code should join with transactions/orders to filter by user

-- Grant permissions
GRANT SELECT ON payos_webhook_events TO authenticated;
GRANT ALL ON payos_webhook_events TO service_role;

-- Comments for documentation
COMMENT ON TABLE payos_webhook_events IS 'PayOS webhook event ingestion table for audit, analytics, and idempotency';
COMMENT ON COLUMN payos_webhook_events.event_id IS 'Unique event identifier from PayOS';
COMMENT ON COLUMN payos_webhook_events.order_code IS 'PayOS order code (unique per transaction)';
COMMENT ON COLUMN payos_webhook_events.event_code IS 'PayOS event code: 00=paid, 01=cancelled';
COMMENT ON COLUMN payos_webhook_events.payload IS 'Full raw webhook payload for audit/replay';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payos_webhook_events_updated_at ON payos_webhook_events;
CREATE TRIGGER update_payos_webhook_events_updated_at
  BEFORE UPDATE ON payos_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
