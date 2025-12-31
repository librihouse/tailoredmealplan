# Test User Setup Guide

## Overview
This guide explains how to set up a test user that can access paid plans without payment, enabling full SaaS feature development and testing.

## How It Works

1. **Test User ID**: A specific user ID is configured in environment variables
2. **Bypass Payment**: When the test user selects a paid plan, payment is bypassed
3. **Direct Assignment**: Plan is directly assigned to the database with full features
4. **Other Users**: All other users still see the paywall (payment flow disabled for now)

## Setup Instructions

### Step 1: Find Your User ID

You need to get your Supabase user ID. There are several ways:

#### Method 1: Helper Page (Easiest) ⭐ RECOMMENDED
1. Log in to your application
2. Navigate to `/get-user-id` in your browser
3. Your User ID will be displayed with copy buttons
4. Copy the environment variables shown on the page
5. Paste them directly into your `.env.local` file

#### Method 2: Browser Console
1. Log in to your application
2. Open browser DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Type: `console.log("User ID:", user?.id)`
5. Copy the user ID that appears

#### Method 3: Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Users**
4. Find your user account
5. Copy the **UUID** (user ID)
1. Add this temporarily to any page:
```typescript
const { user } = useAuth();
console.log("My User ID:", user?.id);
```
2. Check browser console after page loads

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```bash
# Test User ID - User who can access paid plans without payment
# Get this from Supabase dashboard or browser console (see instructions above)
TEST_USER_ID=your-user-id-here
NEXT_PUBLIC_TEST_USER_ID=your-user-id-here
```

**Important Notes:**
- `TEST_USER_ID` is used server-side (API routes)
- `NEXT_PUBLIC_TEST_USER_ID` is used client-side (React components)
- Both should have the same value (your user ID)
- The user ID is a UUID format (e.g., `123e4567-e89b-12d3-a456-426614174000`)

### Step 3: Restart Development Server

After adding environment variables:
1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Clear browser cache if needed

### Step 4: Test the Setup

1. Log in with your test user account
2. Go to `/pricing` page
3. Click on any paid plan (Individual or Family)
4. You should see a success message and be redirected to dashboard
5. Check that you have the plan's credits and features

## Using the Test Plan Switcher

A test plan switcher component is available at the bottom-right of the screen (only visible to test user).

**Features:**
- Quick buttons to switch between Free, Individual, and Family plans
- Instant plan switching without page reload
- Shows current plan status
- Useful for testing different plan features

**To use:**
1. Make sure you're logged in as the test user
2. Look for the "🧪 Test Mode - Plan Switcher" box at bottom-right
3. Click any plan button to switch instantly

## How to Get Your User ID (Detailed)

### Option A: Using Browser Console

1. **Log in to your app**
2. **Open Developer Tools:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Safari: Enable Developer menu first, then `Cmd+Option+I`

3. **Go to Console tab**

4. **Type this command:**
   ```javascript
   // If you have access to user object
   console.log("User ID:", user?.id);
   
   // Or check localStorage
   console.log("Session:", localStorage.getItem('sb-<project-ref>-auth-token'));
   ```

5. **Copy the UUID** that appears (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Option B: Using Supabase Dashboard

1. Go to https://app.supabase.com
2. Sign in and select your project
3. Navigate to **Authentication** → **Users**
4. Find your user account (by email)
5. Click on the user row
6. Copy the **ID** field (this is the UUID)

### Option C: Add Temporary Code

Add this to any page component temporarily:

```typescript
import { useAuth } from "@/hooks/useAuth";

// In your component:
const { user } = useAuth();

useEffect(() => {
  if (user?.id) {
    console.log("=== YOUR USER ID ===");
    console.log(user.id);
    console.log("===================");
  }
}, [user]);
```

Then check the browser console after the page loads.

## Testing Different Plans

### Test Individual Plan
1. Go to `/pricing`
2. Click "Choose Individual" (or use plan switcher)
3. Verify you get 42 monthly credits
4. Test all Individual plan features

### Test Family Plan
1. Go to `/pricing`
2. Click "Choose Family" (or use plan switcher)
3. Verify you get 210 monthly credits
4. Test family features (multiple members, etc.)

### Test Free Plan
1. Use plan switcher to switch to "Free"
2. Verify you get 7 lifetime credits
3. Test free tier limitations

## Security Notes

- **Test user ID is stored in environment variables** (not hardcoded)
- **Only the specified user ID can bypass payment**
- **Other users cannot access this feature**
- **Easy to disable** by removing the env variable

## Troubleshooting

### "Test user feature is not configured"
- Make sure `TEST_USER_ID` is set in `.env.local`
- Restart your dev server after adding env variables

### "Unauthorized - Test user only"
- Your user ID doesn't match `TEST_USER_ID`
- Double-check the user ID in `.env.local`
- Make sure you're logged in with the correct account

### Plan not assigned
- Check server logs for errors
- Verify database connection
- Check that subscription table exists

### Plan switcher not showing
- Make sure `NEXT_PUBLIC_TEST_USER_ID` is set
- Verify you're logged in as the test user
- Check browser console for errors

## Removing Test User Bypass (When PayPal Ready)

When you're ready to enable real payments:

1. **Remove test user check from pricing page:**
   - Open `app/pricing/page.tsx`
   - Remove the `isTestUser` check
   - Uncomment the payment flow code

2. **Remove environment variables:**
   - Remove `TEST_USER_ID` from `.env.local`
   - Remove `NEXT_PUBLIC_TEST_USER_ID` from `.env.local`

3. **Remove test plan switcher (optional):**
   - Remove `components/TestPlanSwitcher.tsx`
   - Remove any imports of this component

4. **Enable payment flow:**
   - Uncomment payment code in pricing page
   - Test with real PayPal integration

5. **Test payment flow:**
   - Test with PayPal sandbox/test mode
   - Verify subscriptions are created correctly
   - Verify credits are allocated properly

## Example User ID Format

Your user ID will look like this:
```
123e4567-e89b-12d3-a456-426614174000
```

It's a UUID (Universally Unique Identifier) format with:
- 8 characters
- Hyphen
- 4 characters
- Hyphen
- 4 characters
- Hyphen
- 4 characters
- Hyphen
- 12 characters

## Quick Reference

**Environment Variables:**
```bash
TEST_USER_ID=your-uuid-here
NEXT_PUBLIC_TEST_USER_ID=your-uuid-here
```

**API Endpoint:**
- `POST /api/subscriptions/assign-test-plan`
- Requires: `planId`, `billingInterval`
- Returns: subscription data and credits

**Component:**
- `components/TestPlanSwitcher.tsx` - Quick plan switcher UI

**Files Modified:**
- `app/pricing/page.tsx` - Added test user bypass
- `app/api/subscriptions/assign-test-plan/route.ts` - Test plan assignment API

