# Supabase Setup Guide

This guide will help you complete the Supabase integration for your meal planner app.

## ✅ Completed Steps

1. ✅ Installed `@supabase/supabase-js` package
2. ✅ Created Supabase client configuration
3. ✅ Set up authentication hooks and components
4. ✅ Updated meal plan API to use Supabase
5. ✅ Created protected route component
6. ✅ Updated quota management to use Supabase

## 📋 Required Steps

### 1. Create `.env.local` File

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://peamyjzvsdftcgkmbgwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYW15anp2c2RmdGNna21iZ3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDMwMTUsImV4cCI6MjA3NjQ3OTAxNX0.bZ0-VfXG9_bG0D9yaSESb6G3ihej4Qg2XbmNtm6bbU8

# Optional: For server-side admin operations
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret-change-in-production
```

**Note**: The `.env.local` file is already in `.gitignore` and will not be committed to git.

### 2. Run SQL in Supabase SQL Editor

Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan usage tracking
CREATE TABLE IF NOT EXISTS plan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  weekly_plans_used INTEGER DEFAULT 0,
  monthly_plans_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans storage
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (for individual onboarding data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  gender TEXT,
  age INTEGER,
  height REAL, -- in cm
  current_weight REAL, -- in kg
  target_weight REAL, -- in kg
  goal TEXT, -- lose_weight, build_muscle, maintain, health
  activity TEXT, -- sedentary, light, moderate, active, athlete
  diet TEXT[], -- array of dietary preferences
  religious TEXT DEFAULT 'none', -- none, halal, kosher, jain, hindu, buddhist
  conditions TEXT[], -- array of health conditions
  allergies TEXT[], -- array of allergies
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business profiles (for professional onboarding data)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  business_type TEXT, -- nutritionist, gym, clinic, etc.
  website TEXT,
  phone TEXT,
  logo_url TEXT,
  brand_colors TEXT, -- JSON string (deprecated, use theme_colors)
  theme_colors TEXT, -- JSON string: { primary: string, secondary: string, background: "light" | "dark" }
  tagline TEXT,
  free_daily_plan_generated BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage" ON plan_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own business profile" ON business_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business profile" ON business_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business profile" ON business_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  INSERT INTO public.subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Configure Vite Environment Variables

Update `vite.config.ts` to include environment variable prefixes:

```typescript
// Add to your vite config
export default defineConfig({
  // ... existing config
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'], // Allow both prefixes
});
```

Or update `client/src/lib/supabase.ts` to read from `import.meta.env` properly.

### 4. Test Authentication

1. Start your dev server: `npm run dev`
2. Navigate to `/auth` or `/signup`
3. Create an account
4. Check Supabase dashboard → Authentication → Users to verify the user was created
5. Check Supabase dashboard → Table Editor → `users` to verify the user record was created
6. Check Supabase dashboard → Table Editor → `subscriptions` to verify a free subscription was created

### 5. Test Protected Routes

1. Sign in to your account
2. Try accessing a protected route (you'll need to wrap it with `<ProtectedRoute>`)
3. Sign out and verify you're redirected to login

### 6. Test Meal Plan Generation

1. Sign in to your account
2. Make a request to `/api/mealplan/generate` with proper authentication
3. Check the `plan_usage` table to verify usage was incremented
4. Check the `meal_plans` table to verify the plan was saved

## 🔧 Configuration Files

### Frontend Supabase Client
- **Location**: `client/src/lib/supabase.ts`
- **Purpose**: Creates Supabase client for frontend use
- **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend Supabase Client
- **Location**: `server/supabase.ts`
- **Purpose**: Creates Supabase client for server-side operations
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (optional)

### Authentication Hook
- **Location**: `client/src/hooks/useAuth.ts`
- **Purpose**: Provides auth state and methods (signUp, signIn, signOut)

### Protected Route Component
- **Location**: `client/src/components/ProtectedRoute.tsx`
- **Usage**: Wrap any route that requires authentication

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

<Route path="/dashboard">
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
</Route>
```

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Check that variables are prefixed with `VITE_` or `NEXT_PUBLIC_`
- Restart your dev server after creating/updating `.env.local`

### "Unauthorized" errors
- Verify the JWT token is being sent in the Authorization header
- Check that the token is valid in Supabase dashboard
- Ensure RLS policies are correctly configured

### User not created in `users` table
- Check the trigger function `handle_new_user()` exists
- Verify the trigger is attached to `auth.users`
- Check Supabase logs for errors

### Quota not incrementing
- Verify the `plan_usage` table has a record for the user
- Check that `subscription_id` matches an active subscription
- Verify the billing period dates are correct

## 📚 Next Steps

1. **Add Email Verification**: Configure Supabase to require email verification
2. **Add Password Reset**: Implement forgot password flow
3. **Add Social Auth**: Configure Google/Apple OAuth providers
4. **Add User Profile**: Create a profile page to update user information
5. **Add Dashboard**: Create a dashboard page showing usage and meal plans
6. **Add Stripe Integration**: Connect Stripe for subscription payments

## 🔐 Security Notes

- Never commit `.env.local` to git (already in `.gitignore`)
- Use service role key only on server-side, never in client code
- RLS policies ensure users can only access their own data
- JWT tokens are automatically refreshed by the Supabase client
- All API routes require authentication via Bearer token

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

