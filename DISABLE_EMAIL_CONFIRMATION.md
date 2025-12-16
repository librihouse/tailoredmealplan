# Disable Email Confirmation for Testing

To disable email confirmation in Supabase for testing purposes:

## Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Settings** (or go to **Providers** → **Email**)

3. **Disable Email Confirmation**
   - Find the section **"Email Auth"** or **"Email Provider"**
   - Look for **"Enable email confirmations"** toggle
   - **Turn it OFF** (disable it)

4. **Save Changes**
   - Click **Save** or the changes will auto-save

5. **Test Again**
   - Try signing up and signing in again
   - You should now be able to log in immediately without email confirmation

## Alternative: Auto-Confirm via API (Advanced)

If you have the `SUPABASE_SERVICE_ROLE_KEY`, you can also auto-confirm users programmatically, but the dashboard method above is simpler for testing.

## Re-enable for Production

**Important**: Remember to re-enable email confirmation before going to production for security!

