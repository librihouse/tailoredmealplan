-- Migration: Add missing columns to existing tables
-- Run this if tables already exist but are missing new columns
-- Safe to run multiple times

-- ============================================================================
-- Add credits columns to plan_usage table
-- ============================================================================
DO $$ 
BEGIN
  -- Add credits_used column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_used INTEGER DEFAULT 0;
  END IF;

  -- Add credits_limit column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'plan_usage' AND column_name = 'credits_limit'
  ) THEN
    ALTER TABLE plan_usage ADD COLUMN credits_limit INTEGER;
  END IF;
END $$;

-- ============================================================================
-- Add family_member_id and plan_version to meal_plans table
-- ============================================================================
DO $$ 
BEGIN
  -- Add family_member_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'family_member_id'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN family_member_id UUID;
  END IF;

  -- Add plan_version column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meal_plans' AND column_name = 'plan_version'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN plan_version INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================================================
-- Add foreign key constraint for meal_plans.family_member_id (if family_members table exists)
-- ============================================================================
DO $$ 
BEGIN
  -- Check if family_members table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'family_members'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
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
  END IF;
END $$;

-- ============================================================================
-- Create indexes for new columns
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_meal_plans_family_member_id ON meal_plans(family_member_id);

