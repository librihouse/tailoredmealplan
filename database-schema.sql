-- TailoredMealPlan Database Schema
-- Run this SQL in your Supabase SQL Editor to set up all required tables

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores user subscription information
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', etc.
  billing_interval TEXT, -- 'monthly' or 'annual'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 2. PLAN_USAGE TABLE
-- ============================================================================
-- Tracks usage/quota for each user's billing period
CREATE TABLE IF NOT EXISTS plan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  weekly_plans_used INTEGER DEFAULT 0,
  monthly_plans_used INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0, -- NEW: Credits used this period
  credits_limit INTEGER, -- NEW: Credits limit from plan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription_id, billing_period_start)
);

CREATE INDEX IF NOT EXISTS idx_plan_usage_user_id ON plan_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_usage_subscription_id ON plan_usage(subscription_id);

-- ============================================================================
-- 3. MEAL_PLANS TABLE
-- ============================================================================
-- Stores generated meal plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  plan_data JSONB NOT NULL, -- Stores the full meal plan data
  family_member_id UUID, -- NEW: For family plans, links to family_members table
  plan_version INTEGER DEFAULT 1, -- NEW: For regenerations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_plan_type ON meal_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_meal_plans_family_member_id ON meal_plans(family_member_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_created_at ON meal_plans(created_at DESC);

-- ============================================================================
-- 3.5. SHARED_MEAL_PLANS TABLE
-- ============================================================================
-- Stores shareable links for meal plans
CREATE TABLE IF NOT EXISTS shared_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_meal_plans_token ON shared_meal_plans(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_meal_plans_meal_plan_id ON shared_meal_plans(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_shared_meal_plans_user_id ON shared_meal_plans(user_id);

-- ============================================================================
-- 4. USER_PROFILES TABLE
-- ============================================================================
-- Stores individual user profile and onboarding data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT false,
  gender TEXT,
  age INTEGER,
  height NUMERIC, -- in cm
  current_weight NUMERIC, -- in kg
  target_weight NUMERIC, -- in kg
  goal TEXT, -- 'lose_weight', 'build_muscle', 'maintain', etc.
  activity TEXT, -- 'sedentary', 'light', 'moderate', 'active', 'athlete'
  diet TEXT[], -- Array of dietary preferences
  religious TEXT DEFAULT 'none', -- 'none', 'halal', 'kosher', 'jain', etc.
  conditions TEXT[], -- Array of medical conditions
  allergies TEXT[], -- Array of allergies
  transition_info JSONB, -- For trans-friendly support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================================
-- 5. BUSINESS_PROFILES TABLE
-- ============================================================================
-- Stores professional/business user profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  website TEXT,
  phone TEXT,
  logo_url TEXT,
  brand_colors JSONB, -- JSON object for brand colors
  theme_colors JSONB, -- JSON object for theme colors
  tagline TEXT,
  free_daily_plan_generated BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- ============================================================================
-- 6. FAMILY_MEMBERS TABLE (NEW)
-- ============================================================================
-- Stores family members for family plans
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height NUMERIC, -- in cm
  current_weight NUMERIC, -- in kg
  target_weight NUMERIC, -- in kg
  activity_level TEXT, -- 'sedentary', 'light', 'moderate', 'active', 'athlete'
  religious_diet TEXT DEFAULT 'none',
  medical_conditions JSONB, -- Array of medical conditions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id);

-- Add foreign key constraint for meal_plans.family_member_id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_meal_plans_family_member'
  ) THEN
    ALTER TABLE meal_plans 
    ADD CONSTRAINT fk_meal_plans_family_member 
    FOREIGN KEY (family_member_id) 
    REFERENCES family_members(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables (if not already enabled)
DO $$ 
BEGIN
  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================
-- Users can only access their own data

-- Subscriptions: Users can read/update their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Plan Usage: Users can read/update their own usage
DROP POLICY IF EXISTS "Users can view own plan usage" ON plan_usage;
CREATE POLICY "Users can view own plan usage" ON plan_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plan usage" ON plan_usage;
CREATE POLICY "Users can update own plan usage" ON plan_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Meal Plans: Users can read/write/delete their own meal plans
DROP POLICY IF EXISTS "Users can view own meal plans" ON meal_plans;
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meal plans" ON meal_plans;
CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meal plans" ON meal_plans;
CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meal plans" ON meal_plans;
CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- User Profiles: Users can read/write their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Business Profiles: Users can read/write their own business profile
DROP POLICY IF EXISTS "Users can view own business profile" ON business_profiles;
CREATE POLICY "Users can view own business profile" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business profile" ON business_profiles;
CREATE POLICY "Users can insert own business profile" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business profile" ON business_profiles;
CREATE POLICY "Users can update own business profile" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Family Members: Users can read/write/delete their own family members
DROP POLICY IF EXISTS "Users can view own family members" ON family_members;
CREATE POLICY "Users can view own family members" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own family members" ON family_members;
CREATE POLICY "Users can insert own family members" ON family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own family members" ON family_members;
CREATE POLICY "Users can update own family members" ON family_members
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own family members" ON family_members;
CREATE POLICY "Users can delete own family members" ON family_members
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables (drop if exists first)
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_usage_updated_at ON plan_usage;
CREATE TRIGGER update_plan_usage_updated_at BEFORE UPDATE ON plan_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON business_profiles;
CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. PLANS TABLE
-- ============================================================================
-- Stores all subscription plans (database-driven pricing)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('b2c', 'b2b')),
  price_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_annual NUMERIC(10, 2) NOT NULL DEFAULT 0,
  limits JSONB NOT NULL,
  features JSONB DEFAULT '{}',
  support TEXT DEFAULT 'email',
  cta TEXT,
  popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_sort_order ON plans(sort_order);

-- ============================================================================
-- 11. CREDIT_PURCHASES TABLE
-- ============================================================================
-- Stores credit add-on purchases for Professional tier users
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'professional',
  credits_amount INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  payment_id TEXT,
  applied_to_usage BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_expires_at ON credit_purchases(expires_at);

-- ============================================================================
-- 12. API_USAGE_LOGS TABLE
-- ============================================================================
-- Tracks API usage and costs for monitoring and analytics
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_meal_plan_id ON api_usage_logs(meal_plan_id);

-- ============================================================================
-- 13. UPDATE PLAN_USAGE TABLE
-- ============================================================================
-- Add columns for purchased credits tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_purchased'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_purchased INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_expires_at'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 14. ENABLE RLS ON NEW TABLES
-- ============================================================================
DO $$ 
BEGIN
  ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 15. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Plans: Public can view active plans
DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;
CREATE POLICY "Anyone can view active plans" ON plans
  FOR SELECT USING (is_active = true);

-- Credit Purchases: Users can view their own purchases
DROP POLICY IF EXISTS "Users can view own credit purchases" ON credit_purchases;
CREATE POLICY "Users can view own credit purchases" ON credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit purchases" ON credit_purchases;
CREATE POLICY "Users can insert own credit purchases" ON credit_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credit purchases" ON credit_purchases;
CREATE POLICY "Users can update own credit purchases" ON credit_purchases
  FOR UPDATE USING (auth.uid() = user_id);

-- API Usage Logs: Users can view their own logs
DROP POLICY IF EXISTS "Users can view own api usage logs" ON api_usage_logs;
CREATE POLICY "Users can view own api usage logs" ON api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 16. TRIGGERS FOR NEW TABLES
-- ============================================================================
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_purchases_updated_at ON credit_purchases;
CREATE TRIGGER update_credit_purchases_updated_at BEFORE UPDATE ON credit_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

