-- ============================================================================
-- WellNexus RaaS — Subscription Payment Intents
-- Migration: 20260228_subscription_payment_intents.sql
-- Purpose: Lưu intent thanh toán subscription để webhook activate đúng plan
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_payment_intents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id          UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle    TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  payos_order_code BIGINT NOT NULL UNIQUE,
  amount           BIGINT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid', 'canceled', 'expired')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sub_intents_order_code ON subscription_payment_intents(payos_order_code);
CREATE INDEX IF NOT EXISTS idx_sub_intents_user_id    ON subscription_payment_intents(user_id);

-- RLS: service role only (webhook dùng service role key)
ALTER TABLE subscription_payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_intents_own_read"
  ON subscription_payment_intents FOR SELECT
  USING (auth.uid() = user_id);
