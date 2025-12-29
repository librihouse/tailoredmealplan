-- Migration: Remove Professional Tier, Add Family Plan
-- Date: 2025-01-XX
-- Description: Migrate from 3-tier (Free, Individual, Professional) to 2-tier B2C (Free, Individual, Family)

BEGIN;

-- 1. Insert Family plan
INSERT INTO plans (id, name, description, category, price_monthly, price_annual, limits, features, is_active, sort_order)
VALUES (
  'family',
  'Family',
  'Perfect for families with up to 5 members. Each member gets 30 daily plans, 4 weekly plans, and 1 monthly plan per month.',
  'b2c',
  14.99,
  12.99,
  '{"clients": 5, "weeklyPlans": 20, "monthlyPlans": 5, "teamSeats": 5, "monthlyCredits": 210}'::jsonb,
  '{}'::jsonb,
  true,
  3
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  is_active = true;

-- 2. Deactivate Professional plan
UPDATE plans 
SET is_active = false, updated_at = NOW()
WHERE id = 'professional';

-- 3. Migrate existing Professional subscriptions to Family
UPDATE subscriptions 
SET plan_id = 'family', updated_at = NOW()
WHERE plan_id = 'professional' AND status = 'active';

-- 4. Update plan_usage for migrated users
UPDATE plan_usage pu
SET credits_limit = 210, updated_at = NOW()
FROM subscriptions s
WHERE pu.subscription_id = s.id 
  AND s.plan_id = 'family'
  AND pu.billing_period_end > NOW();

-- 5. Reset credits for migrated users (give them full Family credits)
UPDATE plan_usage pu
SET credits_used = 0, credits_limit = 210, updated_at = NOW()
FROM subscriptions s
WHERE pu.subscription_id = s.id 
  AND s.plan_id = 'family'
  AND pu.billing_period_start <= NOW()
  AND pu.billing_period_end > NOW();

COMMIT;

