/**
 * Environment Variable Check Helper
 * Provides utilities to check and diagnose environment variable issues
 */

/**
 * Check if required Supabase environment variables are set
 * Returns diagnostic information without exposing sensitive values
 */
export function checkSupabaseEnv(): {
  hasUrl: boolean;
  hasKey: boolean;
  urlValid: boolean;
  keyValid: boolean;
  allValid: boolean;
  issues: string[];
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const issues: string[] = [];
  
  if (!url || url.trim() === '') {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  
  if (!key || key.trim() === '') {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
  
  const urlValid = url.includes('supabase.co') || url.includes('supabase.in');
  const keyValid = key.length > 20;
  
  if (url && !urlValid) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
  }
  
  if (key && !keyValid) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  return {
    hasUrl: !!url && url.trim() !== '',
    hasKey: !!key && key.trim() !== '',
    urlValid,
    keyValid,
    allValid: urlValid && keyValid,
    issues,
  };
}

/**
 * Get setup instructions for Supabase configuration
 */
export function getSupabaseSetupInstructions(): string[] {
  return [
    '1. Go to https://app.supabase.com and sign in',
    '2. Select your project (or create a new one)',
    '3. Go to Settings → API',
    '4. Copy the "Project URL" and add it to .env.local as:',
    '   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co',
    '5. Copy the "anon public" key and add it to .env.local as:',
    '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here',
    '6. Save the .env.local file',
    '7. Restart your dev server (stop with Ctrl+C and run npm run dev again)',
  ];
}

