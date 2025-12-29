# Quick Fix: Supabase Configuration

## The Problem
You're seeing "Unable to connect to authentication service" because Supabase environment variables are missing from `.env.local`.

## Quick Fix Steps

### 1. Open your `.env.local` file
The file is located at: `/Users/kuldeepsharma/Desktop/Meal Plan app/Tailored-MealPlan/.env.local`

### 2. Add these two lines (if they don't exist):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Get your Supabase credentials:

1. Go to https://app.supabase.com
2. Sign in to your account
3. Select your project (or create a new one if you don't have one)
4. Click on **Settings** (gear icon in the left sidebar)
5. Click on **API** in the settings menu
6. You'll see:
   - **Project URL** - Copy this and use it for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key - Copy this and use it for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Example `.env.local` file:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example-key-here

# Other variables (if you have them)
OPENAI_API_KEY=your-openai-key
RAZORPAY_KEY_ID=your-razorpay-key
```

### 5. Important: Restart your dev server

After adding the variables:
1. Stop your current dev server (press `Ctrl+C` in the terminal)
2. Start it again: `npm run dev`
3. The environment variables are only loaded when the server starts

### 6. Verify it's working:

1. Open your browser console (F12 or Cmd+Option+I)
2. Look for a message that says: "✓ Supabase configuration loaded successfully"
3. If you see an error, check the console for detailed diagnostics

## Troubleshooting

### If variables are still not working:

1. **Check for typos**: Variable names must be exactly:
   - `NEXT_PUBLIC_SUPABASE_URL` (not `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)

2. **Check for quotes**: Don't use quotes around values:
   - ✅ Correct: `NEXT_PUBLIC_SUPABASE_URL=https://...`
   - ❌ Wrong: `NEXT_PUBLIC_SUPABASE_URL="https://..."`

3. **Check for spaces**: No spaces around the `=` sign:
   - ✅ Correct: `NEXT_PUBLIC_SUPABASE_URL=https://...`
   - ❌ Wrong: `NEXT_PUBLIC_SUPABASE_URL = https://...`

4. **File location**: Make sure `.env.local` is in the project root (same folder as `package.json`)

5. **Server restart**: You MUST restart the dev server after changing `.env.local`

## Still having issues?

Check the browser console (F12) for detailed error messages. The console will show exactly what's missing or invalid.

