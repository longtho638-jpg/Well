-- Dead Letter Queue for Failed Webhooks
-- Stores webhook events that failed processing for manual review/replay

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  order_code BIGINT NOT NULL,
  raw_payload JSONB NOT NULL,
  signature TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB,
  failure_count INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'discarded')),
  last_error_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_dlq_status ON dead_letter_queue(status);
CREATE INDEX idx_dlq_order_code ON dead_letter_queue(order_code);
CREATE INDEX idx_dlq_created_at ON dead_letter_queue(created_at DESC);
CREATE INDEX idx_dlq_pending ON dead_letter_queue(status, created_at) WHERE status = 'pending';

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_dead_letter_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dead_letter_queue_updated_at
  BEFORE UPDATE ON dead_letter_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_dead_letter_queue_updated_at();

-- RLS (Row Level Security)
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write DLQ
CREATE POLICY admin_only_dlq ON dead_letter_queue
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Comments
COMMENT ON TABLE dead_letter_queue IS 'Stores failed webhook events for manual review and replay';
COMMENT ON COLUMN dead_letter_queue.event_type IS 'Type of webhook event (payment.paid, payment.cancelled, etc.)';
COMMENT ON COLUMN dead_letter_queue.raw_payload IS 'Original webhook payload for replay';
COMMENT ON COLUMN dead_letter_queue.failure_count IS 'Number of processing attempts';
COMMENT ON COLUMN dead_letter_queue.status IS 'pending: needs review, processing: being retried, resolved: fixed, discarded: unfixable';

-- ─── Increment Failure Count Function ────────────────────────────

CREATE OR REPLACE FUNCTION increment_dlq_failure_count(p_id UUID, p_error_message TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE dead_letter_queue
  SET 
    failure_count = failure_count + 1,
    last_error_at = NOW(),
    error_message = p_error_message,
    status = 'pending'
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- ─── DLQ Stats View ─────────────────────────────────────────────

CREATE OR REPLACE VIEW dlq_stats AS
SELECT
  status,
  COUNT(*) as count,
  AVG(failure_count) as avg_failures,
  MAX(created_at) as last_created
FROM dead_letter_queue
GROUP BY status;

-- Grant read access to admins
GRANT SELECT ON dlq_stats TO authenticated;
