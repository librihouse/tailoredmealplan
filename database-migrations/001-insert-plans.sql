-- Migration: Insert Initial Plans
-- Description: Inserts the optimized pricing plans into the plans table
-- Run this in Supabase SQL Editor after creating the plans table

INSERT INTO plans (id, name, description, category, price_monthly, price_annual, limits, features, support, cta, popular, sort_order) VALUES
(
  'free',
  'Free Tier',
  'Perfect for trying out personalized nutrition.',
  'b2c',
  0,
  0,
  '{"clients": 1, "weeklyPlans": 1, "monthlyPlans": 0, "teamSeats": 1, "monthlyCredits": 7}'::jsonb,
  '{}'::jsonb,
  'email',
  'Get Started Free',
  false,
  1
),
(
  'individual',
  'Individual',
  'Comprehensive nutrition planning for dedicated health enthusiasts.',
  'b2c',
  9.99,
  7.40,
  '{"clients": 1, "weeklyPlans": 50, "monthlyPlans": 0, "teamSeats": 1, "monthlyCredits": 42}'::jsonb,
  '{}'::jsonb,
  'email',
  'Start 7-Day Trial',
  true,
  2
),
(
  'professional',
  'Professional',
  'Enterprise-grade meal planning for nutrition professionals managing up to 100 clients.',
  'b2b',
  29.99,
  24.99,
  '{"clients": 100, "weeklyPlans": 500, "monthlyPlans": 60, "teamSeats": 5, "monthlyCredits": 900}'::jsonb,
  '{"fullWhitelabel": true, "customBranding": true, "bulkGeneration": true, "apiAccess": true}'::jsonb,
  'priority',
  'Start 14-Day Trial',
  false,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  support = EXCLUDED.support,
  cta = EXCLUDED.cta,
  popular = EXCLUDED.popular,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

