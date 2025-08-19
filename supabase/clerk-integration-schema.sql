-- ========================================
-- EasyPick Clerk Integration Schema
-- Subscription and Payment Data Model
-- ========================================

-- ========================================
-- CORE TABLES
-- ========================================

-- 1. User Profiles (Clerk Integration)
CREATE TABLE public.clerk_profiles (
  id UUID PRIMARY KEY, -- Clerk user ID (not generated)
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'free' CHECK (role IN ('free', 'pro', 'business')),
  plan VARCHAR(50), -- e.g., 'pro_monthly', 'business_yearly'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  clerk_metadata JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Subscriptions
CREATE TABLE public.clerk_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- e.g., 'pro_monthly', 'business_yearly'
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'suspended', 'trialing', 'incomplete')),
  paypal_subscription_id VARCHAR(255),
  paypal_plan_id VARCHAR(255),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Transactions
CREATE TABLE public.clerk_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.clerk_subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Amount in smallest currency unit (cents/won)
  currency VARCHAR(3) DEFAULT 'KRW' CHECK (currency IN ('KRW', 'USD', 'EUR')),
  transaction_type VARCHAR(20) DEFAULT 'payment' CHECK (transaction_type IN ('payment', 'refund', 'chargeback', 'fee')),
  payment_method VARCHAR(20) DEFAULT 'paypal' CHECK (payment_method IN ('paypal', 'card', 'bank_transfer')),
  paypal_tx_id VARCHAR(255),
  paypal_payer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'canceled', 'refunded')),
  description TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Usage Events
CREATE TABLE public.clerk_usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.clerk_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('compile_prompt', 'run_workflow', 'api_call', 'export_data', 'ai_generation', 'search_query')),
  resource_id UUID, -- ID of the resource being used (prompt, workflow, etc.)
  count INTEGER DEFAULT 1, -- Number of units consumed
  billing_period_start TIMESTAMP WITH TIME ZONE, -- For usage aggregation
  metadata JSONB DEFAULT '{}', -- Flexible event data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Plan Definitions
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'pro_monthly'
  plan_name VARCHAR(100) NOT NULL, -- e.g., 'Pro Monthly'
  role VARCHAR(20) NOT NULL CHECK (role IN ('free', 'pro', 'business')),
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  amount INTEGER NOT NULL, -- Price in smallest currency unit
  currency VARCHAR(3) DEFAULT 'KRW',
  trial_period_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}', -- Feature flags and limits
  usage_limits JSONB DEFAULT '{}', -- Usage quotas per billing period
  paypal_plan_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Profiles indexes
CREATE INDEX idx_clerk_profiles_email ON public.clerk_profiles(email);
CREATE INDEX idx_clerk_profiles_role ON public.clerk_profiles(role);
CREATE INDEX idx_clerk_profiles_plan ON public.clerk_profiles(plan);

-- Subscriptions indexes
CREATE INDEX idx_clerk_subscriptions_user_id ON public.clerk_subscriptions(user_id);
CREATE INDEX idx_clerk_subscriptions_status ON public.clerk_subscriptions(status);
CREATE INDEX idx_clerk_subscriptions_paypal_id ON public.clerk_subscriptions(paypal_subscription_id);
CREATE INDEX idx_clerk_subscriptions_period ON public.clerk_subscriptions(current_period_start, current_period_end);

-- Transactions indexes
CREATE INDEX idx_clerk_transactions_user_id ON public.clerk_transactions(user_id);
CREATE INDEX idx_clerk_transactions_subscription_id ON public.clerk_transactions(subscription_id);
CREATE INDEX idx_clerk_transactions_paypal_tx_id ON public.clerk_transactions(paypal_tx_id);
CREATE INDEX idx_clerk_transactions_created_at ON public.clerk_transactions(created_at DESC);
CREATE INDEX idx_clerk_transactions_status ON public.clerk_transactions(status);

-- Usage events indexes
CREATE INDEX idx_clerk_usage_events_user_id ON public.clerk_usage_events(user_id);
CREATE INDEX idx_clerk_usage_events_type ON public.clerk_usage_events(event_type);
CREATE INDEX idx_clerk_usage_events_created_at ON public.clerk_usage_events(created_at DESC);
CREATE INDEX idx_clerk_usage_events_billing_period ON public.clerk_usage_events(user_id, billing_period_start);

-- Plan definitions indexes
CREATE INDEX idx_subscription_plans_code ON public.subscription_plans(plan_code);
CREATE INDEX idx_subscription_plans_role ON public.subscription_plans(role);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active);

-- ========================================
-- CONSTRAINTS AND BUSINESS RULES
-- ========================================

-- Ensure only one active subscription per user
CREATE UNIQUE INDEX idx_clerk_subscriptions_user_active 
ON public.clerk_subscriptions(user_id) 
WHERE status = 'active';

-- Ensure proper billing period relationships
ALTER TABLE public.clerk_subscriptions 
ADD CONSTRAINT check_period_order 
CHECK (started_at <= current_period_start AND current_period_start < current_period_end);

-- Ensure positive transaction amounts
ALTER TABLE public.clerk_transactions 
ADD CONSTRAINT check_positive_amount 
CHECK (amount > 0);

-- ========================================
-- TRIGGERS AND AUTOMATION
-- ========================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clerk_profiles_updated_at
  BEFORE UPDATE ON public.clerk_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clerk_subscriptions_updated_at
  BEFORE UPDATE ON public.clerk_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sync profile with active subscription
CREATE OR REPLACE FUNCTION sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when subscription becomes active
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE public.clerk_profiles 
    SET 
      role = (SELECT role FROM public.subscription_plans WHERE plan_code = NEW.plan),
      plan = NEW.plan,
      current_period_start = NEW.current_period_start,
      current_period_end = NEW.current_period_end,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  -- Reset to free when subscription ends
  IF NEW.status IN ('canceled', 'ended') AND OLD.status = 'active' THEN
    UPDATE public.clerk_profiles 
    SET 
      role = 'free',
      plan = NULL,
      current_period_start = NULL,
      current_period_end = NULL,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_profile_subscription
  AFTER INSERT OR UPDATE ON public.clerk_subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_profile_subscription();

-- ========================================
-- BUSINESS LOGIC FUNCTIONS
-- ========================================

-- Check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clerk_subscriptions 
    WHERE user_id = p_user_id 
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Get current usage for billing period
CREATE OR REPLACE FUNCTION get_usage_count(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_billing_start TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
  billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Default to current billing period start
  IF p_billing_start IS NULL THEN
    SELECT current_period_start INTO billing_start
    FROM public.clerk_profiles 
    WHERE id = p_user_id;
    
    -- If no subscription, use current month
    billing_start := COALESCE(billing_start, date_trunc('month', NOW()));
  ELSE
    billing_start := p_billing_start;
  END IF;
  
  SELECT COALESCE(SUM(count), 0) INTO usage_count
  FROM public.clerk_usage_events
  WHERE user_id = p_user_id
  AND event_type = p_event_type
  AND created_at >= billing_start;
  
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql;

-- Check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan VARCHAR(50);
  plan_limits JSONB;
  event_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get user's current plan
  SELECT plan INTO user_plan
  FROM public.clerk_profiles
  WHERE id = p_user_id;
  
  -- Free users have strict limits
  IF user_plan IS NULL THEN
    CASE p_event_type
      WHEN 'compile_prompt' THEN event_limit := 10;
      WHEN 'run_workflow' THEN event_limit := 5;
      ELSE event_limit := 0;
    END CASE;
  ELSE
    -- Get limits from plan definition
    SELECT usage_limits INTO plan_limits
    FROM public.subscription_plans
    WHERE plan_code = user_plan AND is_active = TRUE;
    
    event_limit := COALESCE((plan_limits ->> p_event_type)::INTEGER, 999999);
  END IF;
  
  -- Get current usage
  current_usage := get_usage_count(p_user_id, p_event_type);
  
  RETURN (current_usage + p_count) <= event_limit;
END;
$$ LANGUAGE plpgsql;

-- Record usage event with validation
CREATE OR REPLACE FUNCTION record_usage_event(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_resource_id UUID DEFAULT NULL,
  p_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  billing_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check usage limits first
  IF NOT check_usage_limit(p_user_id, p_event_type, p_count) THEN
    RETURN FALSE;
  END IF;
  
  -- Get billing period start
  SELECT current_period_start INTO billing_start
  FROM public.clerk_profiles
  WHERE id = p_user_id;
  
  -- Insert usage event
  INSERT INTO public.clerk_usage_events (
    user_id,
    event_type,
    resource_id,
    count,
    billing_period_start,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_resource_id,
    p_count,
    COALESCE(billing_start, date_trunc('month', NOW())),
    p_metadata
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MONITORING AND ANALYTICS VIEWS
-- ========================================

-- Active subscriptions overview
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  s.plan,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.paypal_subscription_id,
  CASE 
    WHEN s.current_period_end < NOW() THEN 'expired'
    WHEN s.current_period_end < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
    ELSE 'active'
  END as period_status
FROM public.clerk_profiles p
JOIN public.clerk_subscriptions s ON p.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.current_period_end;

-- Usage analytics
CREATE OR REPLACE VIEW usage_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(count) as total_usage
FROM public.clerk_usage_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type
ORDER BY date DESC, event_count DESC;

-- Revenue analytics
CREATE OR REPLACE VIEW revenue_analytics AS
SELECT 
  DATE_TRUNC('month', processed_at) as month,
  currency,
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM public.clerk_transactions
WHERE status = 'completed'
AND processed_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', processed_at), currency, transaction_type
ORDER BY month DESC;

-- User lifecycle metrics
CREATE OR REPLACE VIEW user_lifecycle_metrics AS
SELECT 
  p.role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d,
  COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
  AVG(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400) as avg_days_since_signup
FROM public.clerk_profiles p
LEFT JOIN public.clerk_subscriptions s ON p.id = s.user_id AND s.status = 'active'
GROUP BY p.role
ORDER BY user_count DESC;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.clerk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.clerk_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.clerk_profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.clerk_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.clerk_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Usage events: Users can view their own usage
CREATE POLICY "Users can view own usage events" ON public.clerk_usage_events
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role has full access
CREATE POLICY "Service role full access profiles" ON public.clerk_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access subscriptions" ON public.clerk_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access transactions" ON public.clerk_transactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage" ON public.clerk_usage_events
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample subscription plans
INSERT INTO public.subscription_plans (
  plan_code,
  plan_name,
  role,
  billing_interval,
  amount,
  currency,
  trial_period_days,
  features,
  usage_limits,
  paypal_plan_id
) VALUES 
  (
    'pro_monthly',
    'Pro Monthly',
    'pro',
    'monthly',
    19900,
    'KRW',
    7,
    '{"advanced_prompts": true, "workflow_automation": true, "priority_support": true}',
    '{"compile_prompt": 1000, "run_workflow": 500, "api_call": 10000}',
    'P-pro-monthly-kr'
  ),
  (
    'pro_yearly',
    'Pro Yearly',
    'pro',
    'yearly',
    199000,
    'KRW',
    14,
    '{"advanced_prompts": true, "workflow_automation": true, "priority_support": true}',
    '{"compile_prompt": 12000, "run_workflow": 6000, "api_call": 120000}',
    'P-pro-yearly-kr'
  ),
  (
    'business_monthly',
    'Business Monthly',
    'business',
    'monthly',
    49900,
    'KRW',
    7,
    '{"team_management": true, "custom_integrations": true, "white_label": true, "dedicated_support": true}',
    '{"compile_prompt": -1, "run_workflow": -1, "api_call": -1}',
    'P-business-monthly-kr'
  ),
  (
    'business_yearly',
    'Business Yearly',
    'business',
    'yearly',
    499000,
    'KRW',
    14,
    '{"team_management": true, "custom_integrations": true, "white_label": true, "dedicated_support": true}',
    '{"compile_prompt": -1, "run_workflow": -1, "api_call": -1}',
    'P-business-yearly-kr'
  )
ON CONFLICT (plan_code) DO NOTHING;

-- ========================================
-- GRANTS AND PERMISSIONS
-- ========================================

-- Grant access to authenticated users
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON active_subscriptions TO authenticated;
GRANT SELECT ON usage_analytics TO authenticated;
GRANT SELECT ON revenue_analytics TO authenticated;
GRANT SELECT ON user_lifecycle_metrics TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_count TO authenticated;
GRANT EXECUTE ON FUNCTION check_usage_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage_event TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;