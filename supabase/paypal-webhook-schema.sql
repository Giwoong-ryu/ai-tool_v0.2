-- ========================================
-- PayPal Webhook Integration Schema Extensions
-- Enhanced tables for PayPal subscription and payment tracking
-- ========================================

-- 1. Enhanced subscriptions table for PayPal integration
-- (Assumes existing subscriptions table from main schema)

-- Add PayPal specific columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'paypal',
ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT '[]';

-- Add index for PayPal lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id 
ON public.subscriptions(paypal_subscription_id);

-- 2. Enhanced payments table for PayPal integration
-- (Assumes existing payments table from main schema)

-- Add PayPal specific columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS paypal_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_payer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_transaction_fee INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS webhook_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS raw_webhook_data JSONB;

-- Add indexes for PayPal lookups
CREATE INDEX IF NOT EXISTS idx_payments_paypal_payment_id 
ON public.payments(paypal_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_webhook_event_id 
ON public.payments(webhook_event_id);

-- 3. PayPal webhook events log table
CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  summary TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  processing_error TEXT,
  raw_event_data JSONB NOT NULL,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for webhook events
CREATE INDEX idx_webhook_events_event_id ON public.paypal_webhook_events(event_id);
CREATE INDEX idx_webhook_events_type ON public.paypal_webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON public.paypal_webhook_events(processing_status);
CREATE INDEX idx_webhook_events_created_at ON public.paypal_webhook_events(created_at DESC);

-- 4. PayPal subscription plans reference table
CREATE TABLE IF NOT EXISTS public.paypal_subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_plan_id VARCHAR(255) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'KRW',
  trial_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for plan lookups
CREATE INDEX idx_paypal_plans_plan_id ON public.paypal_subscription_plans(paypal_plan_id);
CREATE INDEX idx_paypal_plans_tier ON public.paypal_subscription_plans(subscription_tier);

-- ========================================
-- Functions for PayPal webhook processing
-- ========================================

-- 1. Function to log webhook events
CREATE OR REPLACE FUNCTION log_paypal_webhook_event(
  p_event_id VARCHAR(255),
  p_event_type VARCHAR(100),
  p_resource_type VARCHAR(50),
  p_resource_id VARCHAR(255),
  p_summary TEXT,
  p_raw_data JSONB,
  p_headers JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  webhook_log_id UUID;
BEGIN
  INSERT INTO public.paypal_webhook_events (
    event_id,
    event_type,
    resource_type,
    resource_id,
    summary,
    raw_event_data,
    headers
  ) VALUES (
    p_event_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_summary,
    p_raw_data,
    p_headers
  )
  ON CONFLICT (event_id) DO UPDATE SET
    processing_status = 'skipped',
    processed_at = NOW()
  RETURNING id INTO webhook_log_id;
  
  RETURN webhook_log_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to mark webhook as processed
CREATE OR REPLACE FUNCTION mark_webhook_processed(
  p_event_id VARCHAR(255),
  p_status VARCHAR(20),
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.paypal_webhook_events 
  SET 
    processing_status = p_status,
    processing_error = p_error,
    processed_at = NOW()
  WHERE event_id = p_event_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to get subscription tier from PayPal plan ID
CREATE OR REPLACE FUNCTION get_tier_from_paypal_plan(p_plan_id VARCHAR(255))
RETURNS VARCHAR(20) AS $$
DECLARE
  tier VARCHAR(20);
BEGIN
  SELECT subscription_tier 
  INTO tier
  FROM public.paypal_subscription_plans 
  WHERE paypal_plan_id = p_plan_id AND is_active = true;
  
  -- Default to 'pro' if plan not found
  RETURN COALESCE(tier, 'pro');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Row Level Security for new tables
-- ========================================

-- PayPal webhook events - admin only
ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only access to webhook events" ON public.paypal_webhook_events
  FOR ALL USING (false); -- Only accessible via service role

-- PayPal subscription plans - read-only for authenticated users
ALTER TABLE public.paypal_subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans" ON public.paypal_subscription_plans
  FOR SELECT USING (is_active = true);

-- ========================================
-- Sample PayPal subscription plans data
-- ========================================

INSERT INTO public.paypal_subscription_plans (
  paypal_plan_id,
  plan_name,
  subscription_tier,
  billing_cycle,
  amount,
  currency
) VALUES 
  ('P-basic-monthly-kr', 'Basic Monthly', 'basic', 'monthly', 9900, 'KRW'),
  ('P-basic-yearly-kr', 'Basic Yearly', 'basic', 'yearly', 99000, 'KRW'),
  ('P-pro-monthly-kr', 'Pro Monthly', 'pro', 'monthly', 19900, 'KRW'),
  ('P-pro-yearly-kr', 'Pro Yearly', 'pro', 'yearly', 199000, 'KRW')
ON CONFLICT (paypal_plan_id) DO NOTHING;

-- ========================================
-- Webhook event cleanup job (optional)
-- ========================================

-- Function to clean up old webhook events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.paypal_webhook_events 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND processing_status IN ('processed', 'skipped');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Views for monitoring and reporting
-- ========================================

-- View for subscription status monitoring
CREATE OR REPLACE VIEW paypal_subscription_status AS
SELECT 
  s.id,
  s.user_id,
  up.email,
  up.name,
  s.subscription_tier,
  s.status,
  s.paypal_subscription_id,
  s.starts_at,
  s.expires_at,
  s.auto_renew,
  p.plan_name,
  p.billing_cycle,
  p.amount,
  p.currency
FROM public.subscriptions s
JOIN public.user_profiles up ON s.user_id = up.id
LEFT JOIN public.paypal_subscription_plans p ON s.paypal_plan_id = p.paypal_plan_id
WHERE s.payment_method = 'paypal'
ORDER BY s.created_at DESC;

-- View for webhook event monitoring
CREATE OR REPLACE VIEW paypal_webhook_monitoring AS
SELECT 
  event_type,
  processing_status,
  verification_status,
  COUNT(*) as event_count,
  MAX(created_at) as last_event,
  COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_count
FROM public.paypal_webhook_events 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type, processing_status, verification_status
ORDER BY event_count DESC;

-- ========================================
-- Grant permissions (run as service role)
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.paypal_subscription_plans TO authenticated;
GRANT SELECT ON paypal_subscription_status TO authenticated;

-- Grant service role full access for webhook processing
GRANT ALL ON public.paypal_webhook_events TO service_role;
GRANT ALL ON public.paypal_subscription_plans TO service_role;
GRANT EXECUTE ON FUNCTION log_paypal_webhook_event TO service_role;
GRANT EXECUTE ON FUNCTION mark_webhook_processed TO service_role;
GRANT EXECUTE ON FUNCTION get_tier_from_paypal_plan TO service_role;