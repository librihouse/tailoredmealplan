-- ============================================================================
-- FIX EXISTING TABLES: Add missing columns to existing tables
-- Run this FIRST if you get "column does not exist" errors
-- ============================================================================

-- Add credits columns to plan_usage table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_used INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_limit'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_limit INTEGER;
  END IF;
END $$;

-- Add family_member_id to meal_plans table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'family_member_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN family_member_id UUID;
  END IF;
END $$;

-- Add plan_version to meal_plans table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'plan_version'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN plan_version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create index on family_member_id (only if column now exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'family_member_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_meal_plans_family_member_id'
    ) THEN
      CREATE INDEX idx_meal_plans_family_member_id ON meal_plans(family_member_id);
    END IF;
  END IF;
END $$;

