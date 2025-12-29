# Database Migration Guide

## Quick Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration SQL

1. Open the file `database-schema.sql` in this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Setup

After running the SQL, check that all tables exist:

1. Go to **Table Editor** in Supabase
2. Verify these tables are present:
   - ✅ subscriptions
   - ✅ plan_usage
   - ✅ meal_plans
   - ✅ user_profiles
   - ✅ business_profiles
   - ✅ family_members

### Step 4: Restart Your Dev Server

After setting up the database:
```bash
# Stop your current server (Ctrl+C)
npm run dev
```

## What the Migration Does

### Creates/Updates Tables:

1. **subscriptions** - User subscription management
2. **plan_usage** - Adds `credits_used` and `credits_limit` columns
3. **meal_plans** - Adds `family_member_id` and `plan_version` columns
4. **user_profiles** - Individual user profiles
5. **business_profiles** - Business/professional profiles
6. **family_members** - NEW table for family plan members

### Sets Up Security:

- Enables Row Level Security (RLS) on all tables
- Creates policies so users can only access their own data
- Sets up foreign key relationships for data integrity

### Adds Performance Indexes:

- Indexes on user_id columns for fast lookups
- Indexes on plan_type, family_member_id for filtering
- Indexes on created_at for sorting

## Important Notes

- The SQL uses `IF NOT EXISTS` - safe to run multiple times
- Existing data will be preserved
- New columns are added with safe defaults
- If tables already exist, only missing columns will be added

## Troubleshooting

If you encounter errors:

1. **"relation already exists"** - This is OK, the table already exists
2. **"column already exists"** - The column is already there, skip that part
3. **"permission denied"** - Make sure you're using the SQL Editor with proper permissions

The SQL is designed to be idempotent (safe to run multiple times).

