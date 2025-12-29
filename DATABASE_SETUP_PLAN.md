# Database Setup Plan for TailoredMealPlan

## Overview

This plan ensures your Supabase database structure matches the application requirements, including support for the new user flow and dashboard features (family members, credit system, plan history).

## Required Database Tables

The application requires the following tables in Supabase:

1. **subscriptions** - User subscription management
2. **plan_usage** - Usage/quota tracking with credits
3. **meal_plans** - Generated meal plans with family member support
4. **user_profiles** - Individual user profile data
5. **business_profiles** - Professional/business profiles
6. **family_members** - Family plan members (NEW)

## Database Schema Changes Needed

### 1. Update `plan_usage` table
- Add `credits_used` column (INTEGER, default 0)
- Add `credits_limit` column (INTEGER, nullable)

### 2. Update `meal_plans` table
- Add `family_member_id` column (UUID, nullable, foreign key to family_members)
- Add `plan_version` column (INTEGER, default 1) - for regenerations

### 3. Create `family_members` table (NEW)
- Full table structure as defined in the plan

## Implementation Steps

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `database-schema.sql`
5. Click **Run** to execute the SQL

The SQL will:
- Create all required tables if they don't exist
- Add missing columns to existing tables
- Set up indexes for performance
- Configure Row Level Security (RLS) policies
- Add triggers for auto-updating timestamps

### Step 2: Verify Tables Created

After running the SQL, verify in Supabase Dashboard → **Table Editor** that these tables exist:
- ✅ subscriptions
- ✅ plan_usage
- ✅ meal_plans
- ✅ user_profiles
- ✅ business_profiles
- ✅ family_members

### Step 3: Verify Columns

Check that `plan_usage` table has:
- ✅ credits_used
- ✅ credits_limit

Check that `meal_plans` table has:
- ✅ family_member_id
- ✅ plan_version

### Step 4: Test the Application

1. Restart your dev server
2. Try to sign up a new user
3. Check browser console for any database errors
4. Verify that the signup works without "not configured" errors

## Table Structures

### subscriptions
- Stores user subscription information
- Links to Supabase Auth users
- Tracks plan_id, status, billing periods

### plan_usage
- Tracks usage per billing period
- Includes credits_used and credits_limit for credit-based system
- Links to subscriptions

### meal_plans
- Stores generated meal plans
- Supports family_member_id for family plans
- plan_version for tracking regenerations

### user_profiles
- Individual user profile data
- Onboarding information
- Dietary preferences and health data

### business_profiles
- Professional/business user profiles
- Branding and white-label settings

### family_members
- Family plan members (max 5 per user)
- Individual profiles for each family member
- Links to meal_plans via family_member_id

## Security

All tables have Row Level Security (RLS) enabled with policies that ensure:
- Users can only access their own data
- Users can only modify their own records
- Foreign key relationships maintain data integrity

## Notes

- The SQL uses `IF NOT EXISTS` so it's safe to run multiple times
- Existing data will be preserved
- New columns are added with appropriate defaults
- Foreign key constraints ensure data integrity

