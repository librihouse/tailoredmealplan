# Email Template Setup Guide

## How to Add the Branded Email Template to Supabase

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Sign in and select your project: `peamyjzvsdftcgkmbgwf`

### Step 2: Navigate to Email Templates
1. Click **Authentication** in the left sidebar
2. Click **Email Templates** (under NOTIFICATIONS section)
3. Select **Reset password** template

### Step 3: Update the Template
1. **Subject Line**: Update to:
   ```
   Reset Your Password - TailoredMealPlan
   ```

2. **Body**: 
   - Click on the **Source** tab
   - Delete all existing content
   - Copy the entire content from `EMAIL_TEMPLATE_RESET_PASSWORD.html`
   - Paste it into the Source editor
   - Click **Save** (or it will auto-save)

### Step 4: Preview (Optional)
1. Click the **Preview** tab to see how the email will look
2. The template uses:
   - Black background (#000000)
   - Primary green accent (#84cc16)
   - White text
   - TailoredMealPlan branding
   - Responsive design for mobile devices

### Step 5: Test
1. Go to your app's forgot password page
2. Enter an email address
3. Check your email inbox
4. You should see the branded email with the TailoredMealPlan theme

## Template Features

- **Dark Theme**: Matches your site's black background
- **Brand Colors**: Uses primary green (#84cc16) for buttons and accents
- **Responsive**: Works on desktop and mobile email clients
- **Professional**: Clean, modern design with clear call-to-action
- **Security Notice**: Includes expiration notice and security information
- **Branding**: TailoredMealPlan logo and tagline

## Important Notes

- The template uses `{{ .ConfirmationURL }}` which is a Supabase variable - don't change this
- All styling is inline (email clients don't support external CSS)
- The template is mobile-responsive using table-based layout
- Colors match your site theme: black background, green primary, white text

## Troubleshooting

If the email doesn't look right:
1. Make sure you're in the **Source** tab, not Preview
2. Check that all HTML is properly formatted
3. Some email clients may render differently - test in Gmail, Outlook, etc.
4. The `{{ .ConfirmationURL }}` variable must remain exactly as shown

