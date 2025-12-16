# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: For server-side admin operations (get from Supabase Dashboard → Settings → API)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration (for meal plan generation)
OPENAI_API_KEY=your-openai-api-key-here

# Razorpay Payment Processor
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id

# Server Configuration
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret-change-in-production
```

## Variable Prefixes

The app supports both `VITE_` and `NEXT_PUBLIC_` prefixes for environment variables:

- **Frontend (Vite)**: Uses `VITE_` or `NEXT_PUBLIC_` prefix
- **Backend (Node.js)**: Uses `NEXT_PUBLIC_` or no prefix

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (optional, for admin operations) → `SUPABASE_SERVICE_ROLE_KEY`

## Security Notes

- ✅ `.env.local` is already in `.gitignore`
- ❌ Never commit `.env.local` to git
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- ❌ Never expose `RAZORPAY_KEY_SECRET` in client code (server-side only)
- ✅ Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
- ✅ Use `VITE_RAZORPAY_KEY_ID` for client-side Razorpay integration
- ✅ Use `RAZORPAY_KEY_SECRET` only on server-side for payment verification
- ✅ Use `SUPABASE_SERVICE_ROLE_KEY` only on server-side

## Verifying Setup

After creating `.env.local`, restart your dev server:

```bash
npm run dev
```

Check the console for any environment variable errors. If you see "Missing Supabase environment variables", verify:

1. `.env.local` exists in the root directory
2. Variables are correctly named (case-sensitive)
3. No extra spaces or quotes around values
4. Dev server was restarted after creating/updating `.env.local`

