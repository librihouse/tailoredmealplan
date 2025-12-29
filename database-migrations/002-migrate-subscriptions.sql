-- Migration: Migrate Existing Subscriptions
-- Description: Maps old plan IDs to new simplified structure
-- Run this in Supabase SQL Editor after inserting plans

-- Migration notes:
-- 'family' → 'individual' (upgrade path, preserve user data)
-- 'starter', 'growth', 'professional', 'enterprise' → 'professional'

-- Map family to individual
UPDATE subscriptions 
SET plan_id = 'individual'
WHERE plan_id = 'family';

-- Map all B2B plans to professional
UPDATE subscriptions 
SET plan_id = 'professional'
WHERE plan_id IN ('starter', 'growth', 'enterprise');

-- Note: Existing 'professional' plan_id remains as 'professional'
-- All plan_usage records are preserved automatically

-- Log migration (optional - create a migration log table if needed)
-- This migration preserves all existing plan_usage records and credit balances

