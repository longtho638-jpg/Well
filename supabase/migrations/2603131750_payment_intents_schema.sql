-- ============================================================================
-- WellNexus RaaS — Payment Intents Schema
-- Migration: 2603131750_payment_intents_schema.sql
-- Purpose: General payment_intents table for order tracking (separate from subscription_payment_intents)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAYMENT_INTENTS TABLE — Track payment intents for orders
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_intents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code    BIGINT NOT NULL UNIQUE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id       UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle TEXT NOT NULL,
  amount        BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. INDEXES — Performance optimization for common queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON payment_intents(order_code);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment intents
CREATE POLICY "Users can view own payment intents"
  ON payment_intents FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all payment intents (for webhooks)
CREATE POLICY "Service role can manage payment intents"
  ON payment_intents FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
