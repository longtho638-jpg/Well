-- Migration: Create push_subscriptions table
-- Created: 2026-02-06
-- Description: Stores Web Push API subscriptions for PWA notifications

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update/delete their own subscription
CREATE POLICY "Users can manage own subscription" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access push_subscriptions" ON public.push_subscriptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER set_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_push_subscriptions_updated_at();
