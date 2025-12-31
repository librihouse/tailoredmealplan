# Test User Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your User ID

**Easiest Method:**
1. Log in to your app
2. Go to: `http://localhost:3000/get-user-id` (or your app URL + `/get-user-id`)
3. Copy your User ID from the page

**Alternative Methods:**
- Browser Console: Log in → F12 → Console → Type: `user?.id`
- Supabase Dashboard: Authentication → Users → Find your user → Copy UUID

### Step 2: Add to .env.local

Add these lines to your `.env.local` file:

```bash
TEST_USER_ID=your-user-id-here
NEXT_PUBLIC_TEST_USER_ID=your-user-id-here
```

Replace `your-user-id-here` with the UUID you copied in Step 1.

### Step 3: Restart Server

```bash
# Stop server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Test It

1. Log in with your test user account
2. Go to `/pricing`
3. Click "Choose Individual" or "Choose Family"
4. You should see: "Success! You've been assigned the [Plan] plan (Test Mode)"
5. You'll be redirected to dashboard with full plan features!

## 🎛️ Test Plan Switcher

After setup, you'll see a floating "🧪 Test Mode - Plan Switcher" box at the bottom-right of the dashboard.

- Click "Free", "Individual", or "Family" to instantly switch plans
- Perfect for testing different plan features
- Only visible to your test user account

## 📝 Your User ID Format

Your User ID is a UUID that looks like:
```
123e4567-e89b-12d3-a456-426614174000
```

## 🔒 Security

- Only YOUR user ID can bypass payment
- Other users still see paywall
- Easy to disable by removing env variables

## 🎯 What You Can Do Now

- ✅ Test Individual plan (42 credits/month)
- ✅ Test Family plan (210 credits/month)
- ✅ Test all paid features
- ✅ Build and test full SaaS functionality
- ✅ Switch between plans instantly

## 🚫 When PayPal is Ready

1. Remove test user check from `app/pricing/page.tsx`
2. Remove `TEST_USER_ID` from `.env.local`
3. Enable payment flow
4. Test with PayPal

---

**Need Help?** See `docs/test-user-setup.md` for detailed instructions.

